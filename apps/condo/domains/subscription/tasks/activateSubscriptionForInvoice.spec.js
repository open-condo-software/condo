const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const {
    updateTestMultiPayment,
    createTestAcquiringIntegration,
    createTestAcquiringIntegrationContext,
} = require('@condo/domains/acquiring/utils/testSchema')
const { INVOICE_STATUS_PAID, INVOICE_TYPE_B2B } = require('@condo/domains/marketplace/constants')
const { createTestInvoice, updateTestInvoice } = require('@condo/domains/marketplace/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const { SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PERIOD } = require('@condo/domains/subscription/constants')
const { activateSubscriptionForInvoiceFn } = require('@condo/domains/subscription/tasks/activateSubscriptionForInvoice')
const {
    createTestSubscriptionPlan,
    createTestSubscriptionPlanPricingRule,
    registerSubscriptionContextByTestClient,
    SubscriptionContext,
} = require('@condo/domains/subscription/utils/testSchema')

describe('activateSubscriptionForInvoice', () => {
    setFakeClientMode(index)

    let adminClient
    let subscriptionPlan
    let pricingRule
    let acquiringIntegration

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()

        const [plan] = await createTestSubscriptionPlan(adminClient)
        subscriptionPlan = plan

        const [rule] = await createTestSubscriptionPlanPricingRule(adminClient, subscriptionPlan, {
            price: '1000',
            period: SUBSCRIPTION_PERIOD.MONTH,
        })
        pricingRule = rule

        const [integration] = await createTestAcquiringIntegration(adminClient, {
            canGroupReceipts: true,
        })
        acquiringIntegration = integration
    })

    describe('successful activation', () => {
        test('finds subscription context by invoice and activates it', async () => {
            const [organization] = await registerNewOrganization(adminClient)

            const [result] = await registerSubscriptionContextByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })

            const subscriptionContext = result.subscriptionContext
            const invoice = subscriptionContext.invoice

            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '1234',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }

            await updateTestMultiPayment(adminClient, result.multiPayment.id, {
                meta: { paymentMethod },
            })

            await updateTestInvoice(adminClient, invoice.id, {
                status: INVOICE_STATUS_PAID,
            })

            await waitFor(async () => {
                const [updatedContext] = await SubscriptionContext.getAll(adminClient, {
                    id: subscriptionContext.id,
                })
                expect(updatedContext.status).toBe(SUBSCRIPTION_CONTEXT_STATUS.DONE)
            })

            const [finalContext] = await SubscriptionContext.getAll(adminClient, {
                id: subscriptionContext.id,
            })

            expect(finalContext.bindingId).toBe(bindingId)
            expect(finalContext.frozenPaymentInfo).toBeDefined()
            expect(finalContext.frozenPaymentInfo.paymentMethod).toEqual(paymentMethod)
            expect(finalContext.frozenPaymentInfo.multiPaymentId).toBe(result.multiPayment.id)
        })
    })

    describe('subscription context not found', () => {
        test('does not throw when no subscription context found for invoice', async () => {
            const [organization] = await registerNewOrganization(adminClient)
            const [payerOrganization] = await registerNewOrganization(adminClient)

            await createTestAcquiringIntegrationContext(adminClient, organization, acquiringIntegration, {
                invoiceStatus: CONTEXT_FINISHED_STATUS,
            })

            const [invoice] = await createTestInvoice(adminClient, organization, {
                type: INVOICE_TYPE_B2B,
                status: INVOICE_STATUS_PAID,
                payerOrganization: { connect: { id: payerOrganization.id } },
            })

            await expect(activateSubscriptionForInvoiceFn(invoice.id)).resolves.not.toThrow()
        })
    })

    describe('wrong status handling', () => {
        test('does not change already DONE subscription context', async () => {
            const [organization] = await registerNewOrganization(adminClient)

            const [result] = await registerSubscriptionContextByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })

            const subscriptionContext = result.subscriptionContext
            const invoice = subscriptionContext.invoice

            expect(subscriptionContext.status).toBe(SUBSCRIPTION_CONTEXT_STATUS.CREATED)

            await updateTestInvoice(adminClient, invoice.id, {
                status: INVOICE_STATUS_PAID,
            })

            let firstUpdatedAt
            await waitFor(async () => {
                const [updatedContext] = await SubscriptionContext.getAll(adminClient, {
                    id: subscriptionContext.id,
                })
                expect(updatedContext.status).toBe(SUBSCRIPTION_CONTEXT_STATUS.DONE)
                firstUpdatedAt = updatedContext.updatedAt
            })

            await activateSubscriptionForInvoiceFn(invoice.id)

            const [contextAfterTask] = await SubscriptionContext.getAll(adminClient, {
                id: subscriptionContext.id,
            })

            expect(contextAfterTask.status).toBe(SUBSCRIPTION_CONTEXT_STATUS.DONE)
            expect(contextAfterTask.updatedAt).toBe(firstUpdatedAt)
        })
    })

    describe('PENDING status activation', () => {
        test('activates subscription context with PENDING status', async () => {
            const [organization] = await registerNewOrganization(adminClient)

            const [result] = await registerSubscriptionContextByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })

            const subscriptionContext = result.subscriptionContext
            const invoice = subscriptionContext.invoice

            await SubscriptionContext.update(adminClient, subscriptionContext.id, {
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
                sender: { dv: 1, fingerprint: 'test' },
            })

            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '1234',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }

            await updateTestMultiPayment(adminClient, result.multiPayment.id, {
                meta: { paymentMethod },
            })

            await updateTestInvoice(adminClient, invoice.id, {
                status: INVOICE_STATUS_PAID,
            })

            await waitFor(async () => {
                const [updatedContext] = await SubscriptionContext.getAll(adminClient, {
                    id: subscriptionContext.id,
                })
                expect(updatedContext.status).toBe(SUBSCRIPTION_CONTEXT_STATUS.DONE)
            })

            const [finalContext] = await SubscriptionContext.getAll(adminClient, {
                id: subscriptionContext.id,
            })

            expect(finalContext.bindingId).toBe(bindingId)
            expect(finalContext.frozenPaymentInfo).toBeDefined()
            expect(finalContext.frozenPaymentInfo.paymentMethod).toEqual(paymentMethod)
        })
    })
})
