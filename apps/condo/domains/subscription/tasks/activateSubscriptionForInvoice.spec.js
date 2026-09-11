const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient, waitFor } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const {
    PAYMENT_DONE_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    updateTestPayment,
    Payment,
    updateTestMultiPayment,
    createTestAcquiringIntegration,
    createTestAcquiringIntegrationContext,
} = require('@condo/domains/acquiring/utils/testSchema')
const { INVOICE_STATUS_PAID, INVOICE_TYPE_B2B } = require('@condo/domains/marketplace/constants')
const { createTestInvoice, updateTestInvoice } = require('@condo/domains/marketplace/utils/testSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema')
const { SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PERIOD, SUBSCRIPTION_PLAN_TYPE_FEATURE } = require('@condo/domains/subscription/constants')
const { activateSubscriptionForInvoiceFn } = require('@condo/domains/subscription/tasks/activateSubscriptionForInvoice')
const {
    createTestSubscriptionPlan,
    createTestSubscriptionPlanPricingRule,
    createTestSubscriptionContext,
    registerSubscriptionContextsByTestClient,
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

            const [result] = await registerSubscriptionContextsByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRules: [{ id: pricingRule.id }],
            })

            const subscriptionContext = result.subscriptionContexts[0]
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

            const [payment] = await Payment.getAll(adminClient, {
                invoice: { id: invoice.id },
                deletedAt: null,
            })

            await updateTestMultiPayment(adminClient, result.multiPayment.id, {
                meta: { paymentMethod },
            })

            await updateTestPayment(adminClient, payment.id, {
                status: PAYMENT_DONE_STATUS,
                advancedAt: dayjs().toISOString(),
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

    describe('paid-date recalculation', () => {
        test('recomputes startAt and endAt from the payment date, not the registration date', async () => {
            const [organization] = await registerNewOrganization(adminClient)

            const [result] = await registerSubscriptionContextsByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRules: [{ id: pricingRule.id }],
            })
            const contextId = result.subscriptionContexts[0].id
            const invoice = result.subscriptionContexts[0].invoice

            expect(result.subscriptionContexts[0].startAt).toBe(dayjs().format('YYYY-MM-DD'))

            const priorEndAt = dayjs().add(45, 'days').format('YYYY-MM-DD')
            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt: priorEndAt,
                isTrial: false,
            })

            const [payment] = await Payment.getAll(adminClient, {
                invoice: { id: invoice.id },
                deletedAt: null,
            })
            await updateTestPayment(adminClient, payment.id, {
                status: PAYMENT_DONE_STATUS,
                advancedAt: dayjs().toISOString(),
            })

            await waitFor(async () => {
                const [ctx] = await SubscriptionContext.getAll(adminClient, { id: contextId })
                expect(ctx.status).toBe(SUBSCRIPTION_CONTEXT_STATUS.DONE)
            })

            const [ctx] = await SubscriptionContext.getAll(adminClient, { id: contextId })
            expect(ctx.startAt).toBe(priorEndAt)
            expect(ctx.endAt).toBe(dayjs(priorEndAt).add(1, 'month').format('YYYY-MM-DD'))
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

            const [result] = await registerSubscriptionContextsByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRules: [{ id: pricingRule.id }],
            })

            const subscriptionContext = result.subscriptionContexts[0]
            const invoice = subscriptionContext.invoice

            expect(subscriptionContext.status).toBe(SUBSCRIPTION_CONTEXT_STATUS.CREATED)

            const [payment] = await Payment.getAll(adminClient, {
                invoice: { id: invoice.id },
                deletedAt: null,
            })

            await updateTestPayment(adminClient, payment.id, {
                status: PAYMENT_DONE_STATUS,
                advancedAt: dayjs().toISOString(),
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

    describe('bundle activation', () => {
        let featurePlan
        let featureRule

        beforeAll(async () => {
            const [fp] = await createTestSubscriptionPlan(adminClient, {
                planType: SUBSCRIPTION_PLAN_TYPE_FEATURE,
                ai: true,
            })
            featurePlan = fp

            const [fr] = await createTestSubscriptionPlanPricingRule(adminClient, featurePlan, {
                price: '400',
                period: SUBSCRIPTION_PERIOD.MONTH,
            })
            featureRule = fr
        })

        test('activates every CREATED context sharing the invoice', async () => {
            const [organization] = await registerNewOrganization(adminClient)

            const [result] = await registerSubscriptionContextsByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRules: [{ id: pricingRule.id }, { id: featureRule.id }],
            })

            expect(result.subscriptionContexts).toHaveLength(2)
            const contextIds = result.subscriptionContexts.map(ctx => ctx.id)
            const invoiceId = result.subscriptionContexts[0].invoice.id

            const bindingId = faker.datatype.uuid()
            await updateTestMultiPayment(adminClient, result.multiPayment.id, {
                meta: {
                    paymentMethod: {
                        bindingId,
                        paymentSystem: 'test-system',
                        cardNumber: '1234',
                        expiration: '12/25',
                        bankName: 'Test Bank',
                        bankCountryCode: 'RU',
                    },
                },
            })

            const [payment] = await Payment.getAll(adminClient, {
                invoice: { id: invoiceId },
                deletedAt: null,
            })
            await updateTestPayment(adminClient, payment.id, {
                status: PAYMENT_DONE_STATUS,
                advancedAt: dayjs().toISOString(),
            })

            await waitFor(async () => {
                const contexts = await SubscriptionContext.getAll(adminClient, { id_in: contextIds })
                expect(contexts).toHaveLength(2)
                expect(contexts.every(ctx => ctx.status === SUBSCRIPTION_CONTEXT_STATUS.DONE)).toBe(true)
            })

            const contexts = await SubscriptionContext.getAll(adminClient, { id_in: contextIds })
            expect(contexts.every(ctx => ctx.bindingId === bindingId)).toBe(true)
        })

        test('activates without a payment method when the invoice was paid without acquiring', async () => {
            const [organization] = await registerNewOrganization(adminClient)

            const [result] = await registerSubscriptionContextsByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRules: [{ id: pricingRule.id }, { id: featureRule.id }],
                paymentType: 'invoice',
            })

            expect(result.multiPayment).toBeNull()
            expect(result.directPaymentUrl).toBeNull()
            const contextIds = result.subscriptionContexts.map(ctx => ctx.id)
            const invoiceId = result.subscriptionContexts[0].invoice.id

            await updateTestInvoice(adminClient, invoiceId, { status: INVOICE_STATUS_PAID })

            await waitFor(async () => {
                const contexts = await SubscriptionContext.getAll(adminClient, { id_in: contextIds })
                expect(contexts).toHaveLength(2)
                expect(contexts.every(ctx => ctx.status === SUBSCRIPTION_CONTEXT_STATUS.DONE)).toBe(true)
            })

            const contexts = await SubscriptionContext.getAll(adminClient, { id_in: contextIds })
            for (const ctx of contexts) {
                expect(ctx.bindingId).toBeNull()
                expect(ctx.frozenPaymentInfo.paymentMethod).toBeNull()
            }
        })
    })

    describe('PENDING status activation', () => {
        test('activates subscription context with PENDING status', async () => {
            const [organization] = await registerNewOrganization(adminClient)

            const [result] = await registerSubscriptionContextsByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRules: [{ id: pricingRule.id }],
            })

            const subscriptionContext = result.subscriptionContexts[0]
            const invoice = subscriptionContext.invoice

            await SubscriptionContext.update(adminClient, subscriptionContext.id, {
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
                sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
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

            const [payment] = await Payment.getAll(adminClient, {
                invoice: { id: invoice.id },
                deletedAt: null,
            })

            await updateTestPayment(adminClient, payment.id, {
                status: PAYMENT_DONE_STATUS,
                advancedAt: dayjs().toISOString(),
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
