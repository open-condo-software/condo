const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { createTestAcquiringIntegration, createTestAcquiringIntegrationContext } = require('@condo/domains/acquiring/utils/testSchema')
const { INVOICE_STATUS_PUBLISHED, INVOICE_STATUS_PAID, INVOICE_TYPE_B2B } = require('@condo/domains/marketplace/constants')
const { Invoice, createTestInvoice } = require('@condo/domains/marketplace/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PERIOD, SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_PLAN_TYPE_FEATURE } = require('@condo/domains/subscription/constants')
const { processRecurrentSubscriptionPayments } = require('@condo/domains/subscription/tasks/processRecurrentSubscriptionPayments')
const {
    createTestSubscriptionPlan,
    createTestSubscriptionPlanPricingRule,
    createTestSubscriptionContext,
    SubscriptionContext,
} = require('@condo/domains/subscription/utils/testSchema')


describe('processRecurrentSubscriptionPayments', () => {
    setFakeClientMode(index)

    let adminClient
    let subscriptionPlan
    let pricingRule
    

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()

        const [plan] = await createTestSubscriptionPlan(adminClient)
        subscriptionPlan = plan

        const [rule] = await createTestSubscriptionPlanPricingRule(adminClient, subscriptionPlan, {
            price: '1000',
            period: SUBSCRIPTION_PERIOD.MONTH,
        })
        pricingRule = rule
    })

    describe('subscription context selection', () => {
        test('processes subscription context ending yesterday with payment method', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '1234',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            const endAt = dayjs().subtract(2, 'days').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            await processRecurrentSubscriptionPayments()

            const contexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
            })

            expect(contexts).toHaveLength(1)
            expect(contexts[0].invoice).toBeDefined()
        })

        test('processes subscription context ending within buffer period', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '5678',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            const endAt = dayjs().subtract(3, 'days').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt: dayjs().subtract(1, 'month').subtract(3, 'days').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            await processRecurrentSubscriptionPayments()

            const contexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
            })

            expect(contexts.length).toBeGreaterThan(0)
        })

        test('processes subscription context ending today', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '0000',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            const endAt = dayjs().format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            await processRecurrentSubscriptionPayments()

            const contexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
            })

            expect(contexts.length).toBeGreaterThan(0)
            expect(contexts[0].invoice).toBeDefined()
        })

        test('does not process subscription context ending beyond buffer period', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '9999',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            const endAt = dayjs().subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS + 1, 'days').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt: dayjs().subtract(1, 'month').subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS + 1, 'days').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            const contextsBefore = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })
            const countBefore = contextsBefore.length

            await processRecurrentSubscriptionPayments()

            const contextsAfter = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })

            expect(contextsAfter).toHaveLength(countBefore)
        })

        test('does not process subscription context without payment method', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const endAt = dayjs().format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId: null,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                },
            })

            const contextsBefore = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
            })
            const countBefore = contextsBefore.length

            await processRecurrentSubscriptionPayments()

            const contextsAfter = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
            })

            expect(contextsAfter).toHaveLength(countBefore)
        })

        test('does not process subscription context with status CREATED', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '1111',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            const endAt = dayjs().format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
                bindingId,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            const contextsBefore = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })
            const countBefore = contextsBefore.length

            await processRecurrentSubscriptionPayments()

            const contextsAfter = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })

            expect(contextsAfter).toHaveLength(countBefore)
        })

        test('skips subscription context without payment method', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const endAt = dayjs().format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId: null,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                },
            })

            const contextsBefore = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
            })
            const countBefore = contextsBefore.length

            await processRecurrentSubscriptionPayments()

            const contextsAfter = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
            })

            expect(contextsAfter).toHaveLength(countBefore)
        })
    })

    describe('latest context check', () => {
        test('processes only the latest subscription context for organization and subscription plan', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '2222',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            
            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt: dayjs().subtract(2, 'months').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            await processRecurrentSubscriptionPayments()

            const contexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
            })

            expect(contexts.length).toBeGreaterThan(0)
        })
    })

    describe('invoice and payment creation', () => {
        test('creates invoice and multiPayment for new subscription context', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '3333',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            const endAt = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            await processRecurrentSubscriptionPayments()

            const contexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
            })

            expect(contexts.length).toBeGreaterThan(0)
            const newContext = contexts[contexts.length - 1]
            expect(newContext.invoice).toBeDefined()

            const invoices = await Invoice.getAll(adminClient, { id: newContext.invoice.id })
            expect(invoices).toHaveLength(1)
            expect(invoices[0].status).toBe(INVOICE_STATUS_PUBLISHED)
        })
    })

    describe('PENDING status handling', () => {
        test('does not process PENDING contexts (only DONE)', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '4444',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            const endAt = dayjs().subtract(2, 'days').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
                bindingId,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            const contextsBefore = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })
            const countBefore = contextsBefore.length

            await processRecurrentSubscriptionPayments()

            const contextsAfter = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })

            expect(contextsAfter).toHaveLength(countBefore)
        })

        test('does not process ERROR contexts (only DONE)', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '5555',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            const endAt = dayjs().subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS + 1, 'days').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.ERROR,
                bindingId,
                startAt: dayjs().subtract(1, 'month').subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS + 1, 'days').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            const contextsBefore = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })
            const countBefore = contextsBefore.length

            await processRecurrentSubscriptionPayments()

            const contextsAfter = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: pricingRule.id },
            })

            expect(contextsAfter).toHaveLength(countBefore)
        })
    })

    describe('bundle renewal', () => {
        let featurePlan
        let featureRule
        let acquiringIntegration

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

            const [integration] = await createTestAcquiringIntegration(adminClient, {
                canGroupReceipts: true,
            })
            acquiringIntegration = integration
        })

        test('renews contexts sharing an invoice as a single new bundle', async () => {
            const [organization] = await createTestOrganization(adminClient)
            const [payerOrganization] = await createTestOrganization(adminClient)

            await createTestAcquiringIntegrationContext(adminClient, organization, acquiringIntegration, {
                invoiceStatus: CONTEXT_FINISHED_STATUS,
            })

            const bindingId = faker.datatype.uuid()
            const paymentMethod = {
                bindingId,
                paymentSystem: 'test-system',
                cardNumber: '9999',
                expiration: '12/25',
                bankName: 'Test Bank',
                bankCountryCode: 'RU',
            }
            const startAt = dayjs().subtract(1, 'month').format('YYYY-MM-DD')
            const endAt = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

            const [sharedInvoice] = await createTestInvoice(adminClient, organization, {
                type: INVOICE_TYPE_B2B,
                status: INVOICE_STATUS_PAID,
                payerOrganization: { connect: { id: payerOrganization.id } },
            })

            await createTestSubscriptionContext(adminClient, payerOrganization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                invoice: { connect: { id: sharedInvoice.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt,
                endAt,
                isTrial: false,
                frozenPaymentInfo: { pricingRuleId: pricingRule.id, paymentMethod },
            })
            await createTestSubscriptionContext(adminClient, payerOrganization, featurePlan, {
                subscriptionPlanPricingRule: { connect: { id: featureRule.id } },
                invoice: { connect: { id: sharedInvoice.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt,
                endAt,
                isTrial: false,
                frozenPaymentInfo: { pricingRuleId: featureRule.id, paymentMethod },
            })

            await processRecurrentSubscriptionPayments()

            const newContexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: payerOrganization.id },
                status_in: [SUBSCRIPTION_CONTEXT_STATUS.PENDING, SUBSCRIPTION_CONTEXT_STATUS.ERROR],
            })

            expect(newContexts).toHaveLength(2)
            const newInvoiceIds = new Set(newContexts.map(ctx => ctx.invoice.id))
            expect(newInvoiceIds.size).toBe(1)
            expect([...newInvoiceIds][0]).not.toBe(sharedInvoice.id)

            const newRuleIds = newContexts.map(ctx => ctx.subscriptionPlanPricingRule.id).sort()
            expect(newRuleIds).toEqual([pricingRule.id, featureRule.id].sort())
        })
    })
})

