/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { INVOICE_STATUS_CANCELED } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const { SUBSCRIPTION_PERIOD, SUBSCRIPTION_PLAN_TYPE_FEATURE } = require('@condo/domains/subscription/constants')
const { SubscriptionContext: SubscriptionContextServerUtils } = require('@condo/domains/subscription/utils/serverSchema')
const {
    SubscriptionContext,
    createTestSubscriptionPlan,
    createTestSubscriptionPlanPricingRule,
    registerSubscriptionContextsByTestClient,
} = require('@condo/domains/subscription/utils/testSchema')

describe('RegisterSubscriptionContextsService', () => {
    setFakeClientMode(index)

    let admin, serviceRule, featureRule

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()

        const [servicePlan] = await createTestSubscriptionPlan(admin)
        ;[serviceRule] = await createTestSubscriptionPlanPricingRule(admin, servicePlan, {
            price: '1000',
            period: SUBSCRIPTION_PERIOD.MONTH,
        })

        const [featurePlan] = await createTestSubscriptionPlan(admin, { planType: SUBSCRIPTION_PLAN_TYPE_FEATURE, ai: true })
        ;[featureRule] = await createTestSubscriptionPlanPricingRule(admin, featurePlan, {
            price: '400',
            period: SUBSCRIPTION_PERIOD.MONTH,
        })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('cancels the invoice and soft deletes created contexts when a bundle context fails to be created', async () => {
        const [organization] = await registerNewOrganization(admin)

        const originalCreate = SubscriptionContextServerUtils.create.bind(SubscriptionContextServerUtils)
        let createCalls = 0
        jest.spyOn(SubscriptionContextServerUtils, 'create').mockImplementation(async (...args) => {
            createCalls++
            if (createCalls === 2) throw new Error('Failed to create the second bundle context')
            return originalCreate(...args)
        })

        await expect(registerSubscriptionContextsByTestClient(admin, {
            organization: { id: organization.id },
            subscriptionPlanPricingRules: [{ id: serviceRule.id }, { id: featureRule.id }],
            paymentType: 'invoice',
        })).rejects.toThrow()

        const invoices = await Invoice.getAll(admin, { payerOrganization: { id: organization.id } })
        expect(invoices).toHaveLength(1)
        expect(invoices[0].status).toBe(INVOICE_STATUS_CANCELED)

        const activeContexts = await SubscriptionContext.getAll(admin, { organization: { id: organization.id } })
        expect(activeContexts).toHaveLength(0)
        const deletedContexts = await SubscriptionContext.getAll(admin, { organization: { id: organization.id }, deletedAt_not: null })
        expect(deletedContexts).toHaveLength(1)
    })
})
