/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')
const { WebhookPayload } = require('@open-condo/webhooks/schema/utils/testSchema')
const { encryptionManager } = require('@open-condo/webhooks/utils/encryption')

const {
    WEBHOOK_EVENT_SUBSCRIPTION_ACTIVATED,
    WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED,
} = require('@condo/domains/common/constants/webhooks')
const { INVOICE_STATUS_PAID } = require('@condo/domains/marketplace/constants')
const { updateTestInvoice } = require('@condo/domains/marketplace/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const {
    SUBSCRIPTION_CONTEXT_STATUS,
    SUBSCRIPTION_WEBHOOK_REASON,
    SUBSCRIPTION_PAYMENT_TYPE_INVOICE,
    SUBSCRIPTION_PERIOD,
    SUBSCRIPTION_PLAN_TYPE_FEATURE,
    SUBSCRIPTION_PLAN_TYPE_SERVICE,
} = require('@condo/domains/subscription/constants')
const {
    SubscriptionContext,
    createTestSubscriptionPlan,
    createTestSubscriptionPlanPricingRule,
    registerSubscriptionContextsByTestClient,
    requestSubscriptionInvoiceByTestClient,
} = require('@condo/domains/subscription/utils/testSchema')

// every subscription webhook (activated, invoice requested, ...) shares this one url/secret - eventType in the payload tells them apart
const WEBHOOK_ENV = {
    SUBSCRIPTION_WEBHOOK_URL: 'https://subscription-webhook.example.com/webhook',
    SUBSCRIPTION_WEBHOOK_SECRET: 'subscription-webhook-secret',
}

describe('subscriptionWebhooks', () => {
    setFakeClientMode(index)

    let admin, servicePlan, serviceRule, featurePlan, featureRule
    const previousEnv = {}

    const findWebhookPayloads = (eventType, subscriptionContextIds) => WebhookPayload.getAll(admin, {
        eventType,
        itemId_in: subscriptionContextIds,
    })

    beforeAll(async () => {
        for (const [key, value] of Object.entries(WEBHOOK_ENV)) {
            previousEnv[key] = process.env[key]
            process.env[key] = value
        }

        admin = await makeLoggedInAdminClient()

        const [plan] = await createTestSubscriptionPlan(admin, { planType: SUBSCRIPTION_PLAN_TYPE_SERVICE, tickets: true })
        servicePlan = plan
        const [rule] = await createTestSubscriptionPlanPricingRule(admin, servicePlan, { price: '1000', period: SUBSCRIPTION_PERIOD.YEAR })
        serviceRule = rule

        const [feature] = await createTestSubscriptionPlan(admin, { planType: SUBSCRIPTION_PLAN_TYPE_FEATURE, ai: true })
        featurePlan = feature
        const [featurePricingRule] = await createTestSubscriptionPlanPricingRule(admin, featurePlan, { price: '400', period: SUBSCRIPTION_PERIOD.YEAR })
        featureRule = featurePricingRule
    })

    afterAll(() => {
        for (const [key, value] of Object.entries(previousEnv)) {
            if (value === undefined) delete process.env[key]
            else process.env[key] = value
        }
    })

    test('registering a bundle to be paid by invoice queues an invoice request with every context of the bundle', async () => {
        const [organization] = await registerNewOrganization(admin)

        const [result] = await registerSubscriptionContextsByTestClient(admin, {
            organization: { id: organization.id },
            subscriptionPlanPricingRules: [{ id: serviceRule.id }, { id: featureRule.id }],
            paymentType: 'invoice',
        })
        const contextIds = result.subscriptionContexts.map(({ id }) => id)

        const [webhookPayload] = await findWebhookPayloads(WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED, contextIds)
        expect(webhookPayload.url).toBe(WEBHOOK_ENV.SUBSCRIPTION_WEBHOOK_URL)

        const payload = JSON.parse(encryptionManager.decrypt(webhookPayload.payload))
        expect(payload.eventType).toBe(WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED)
        expect(payload.invoiceId).toBe(result.subscriptionContexts[0].invoice.id)
        expect(payload.organization.id).toBe(organization.id)
        expect(payload.user.id).toBe(admin.user.id)
        expect(payload.subscriptionContexts).toEqual(expect.arrayContaining([
            expect.objectContaining({ planName: servicePlan.name, planType: SUBSCRIPTION_PLAN_TYPE_SERVICE, period: SUBSCRIPTION_PERIOD.YEAR }),
            expect.objectContaining({ planName: featurePlan.name, planType: SUBSCRIPTION_PLAN_TYPE_FEATURE, period: SUBSCRIPTION_PERIOD.YEAR }),
        ]))
    })

    test('asking for an invoice again queues the same request marked as resend', async () => {
        const [organization] = await registerNewOrganization(admin)

        const [result] = await registerSubscriptionContextsByTestClient(admin, {
            organization: { id: organization.id },
            subscriptionPlanPricingRules: [{ id: serviceRule.id }],
            paymentType: 'invoice',
        })
        const subscriptionContexts = result.subscriptionContexts

        await requestSubscriptionInvoiceByTestClient(admin, {
            subscriptionContexts: subscriptionContexts.map(({ id }) => ({ id })),
        })

        const invoiceRequests = await findWebhookPayloads(WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED, subscriptionContexts.map(({ id }) => id))
        expect(invoiceRequests).toHaveLength(2)
        const payloads = invoiceRequests
            .map(({ payload }) => JSON.parse(encryptionManager.decrypt(payload)))
            .sort((left, right) => left.reason.localeCompare(right.reason))
        expect(payloads[0].reason).toBe(SUBSCRIPTION_WEBHOOK_REASON.PURCHASE)
        expect(payloads[1]).toMatchObject({ reason: SUBSCRIPTION_WEBHOOK_REASON.RESEND, invoiceId: subscriptionContexts[0].invoice.id })
    })

    test('registering a bundle to be paid by card queues no invoice request', async () => {
        const [organization] = await registerNewOrganization(admin)

        const [result] = await registerSubscriptionContextsByTestClient(admin, {
            organization: { id: organization.id },
            subscriptionPlanPricingRules: [{ id: serviceRule.id }],
            paymentType: 'card',
        })

        const webhookPayloads = await findWebhookPayloads(WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED, result.subscriptionContexts.map(({ id }) => id))
        expect(webhookPayloads).toHaveLength(0)
    })

    test('a paid invoice queues an activation webhook with every activated context', async () => {
        const [organization] = await registerNewOrganization(admin)

        const [result] = await registerSubscriptionContextsByTestClient(admin, {
            organization: { id: organization.id },
            subscriptionPlanPricingRules: [{ id: serviceRule.id }, { id: featureRule.id }],
            paymentType: 'invoice',
        })
        const contextIds = result.subscriptionContexts.map(({ id }) => id)

        await updateTestInvoice(admin, result.subscriptionContexts[0].invoice.id, { status: INVOICE_STATUS_PAID })

        await waitFor(async () => {
            const contexts = await SubscriptionContext.getAll(admin, { id_in: contextIds })
            expect(contexts.every(({ status }) => status === SUBSCRIPTION_CONTEXT_STATUS.DONE)).toBe(true)
        })

        await waitFor(async () => {
            const [webhookPayload] = await findWebhookPayloads(WEBHOOK_EVENT_SUBSCRIPTION_ACTIVATED, contextIds)
            const payload = JSON.parse(encryptionManager.decrypt(webhookPayload.payload))

            expect(payload).toMatchObject({ eventType: WEBHOOK_EVENT_SUBSCRIPTION_ACTIVATED, paymentType: SUBSCRIPTION_PAYMENT_TYPE_INVOICE, reason: SUBSCRIPTION_WEBHOOK_REASON.PURCHASE })
            expect(payload.subscriptionContexts.map(({ id }) => id).sort()).toEqual([...contextIds].sort())
            expect(payload.subscriptionContexts).toEqual(expect.arrayContaining([
                expect.objectContaining({ planName: featurePlan.name, planType: SUBSCRIPTION_PLAN_TYPE_FEATURE, period: SUBSCRIPTION_PERIOD.YEAR }),
            ]))
        })
    })
})
