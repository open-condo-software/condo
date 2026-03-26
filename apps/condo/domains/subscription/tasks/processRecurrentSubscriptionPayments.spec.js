const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { INVOICE_STATUS_PUBLISHED } = require('@condo/domains/marketplace/constants')
const { Invoice } = require('@condo/domains/marketplace/utils/testSchema')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { SUBSCRIPTION_CONTEXT_STATUS, SUBSCRIPTION_PERIOD, SUBSCRIPTION_PAYMENT_BUFFER_DAYS } = require('@condo/domains/subscription/constants')
const { processRecurrentSubscriptionPayments } = require('@condo/domains/subscription/tasks/processRecurrentSubscriptionPayments')
const {
    createTestSubscriptionPlan,
    createTestSubscriptionPlanPricingRule,
    createTestSubscriptionContext,
    SubscriptionContext,
    ensureSubscriptionPaymentRecipientForTests,
} = require('@condo/domains/subscription/utils/testSchema')


describe('processRecurrentSubscriptionPayments', () => {
    setFakeClientMode(index)

    let adminClient
    let subscriptionPlan
    let pricingRule
    

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()

        await ensureSubscriptionPaymentRecipientForTests(adminClient)

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
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
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
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
            })

            expect(contexts.length).toBeGreaterThan(0)
        })

        test('does not process subscription context ending today (not yet expired)', async () => {
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
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
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
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
            })

            expect(contexts.length).toBeGreaterThan(0)
            const newContext = contexts[contexts.length - 1]
            expect(newContext.invoice).toBeDefined()

            const invoices = await Invoice.getAll(adminClient, { id: newContext.invoice.id })
            expect(invoices).toHaveLength(1)
            expect(invoices[0].status).toBe(INVOICE_STATUS_PUBLISHED)
        })
    })
})
