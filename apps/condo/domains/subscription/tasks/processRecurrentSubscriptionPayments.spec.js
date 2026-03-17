const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const {
    createTestAcquiringIntegration,
    createTestAcquiringIntegrationContext,
} = require('@condo/domains/acquiring/utils/testSchema')
const { createTestRecipient } = require('@condo/domains/billing/utils/testSchema')
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
} = require('@condo/domains/subscription/utils/testSchema')


describe('processRecurrentSubscriptionPayments', () => {
    setFakeClientMode(index)

    let adminClient
    let recipientOrganization
    let subscriptionPlan
    let pricingRule
    let originalSubscriptionPaymentRecipient

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        
        const [recipientOrg] = await createTestOrganization(adminClient)
        recipientOrganization = recipientOrg

        originalSubscriptionPaymentRecipient = process.env.SUBSCRIPTION_PAYMENT_RECIPIENT
        process.env.SUBSCRIPTION_PAYMENT_RECIPIENT = recipientOrganization.id

        const [plan] = await createTestSubscriptionPlan(adminClient)
        subscriptionPlan = plan

        const [rule] = await createTestSubscriptionPlanPricingRule(adminClient, subscriptionPlan, {
            price: '1000',
            period: SUBSCRIPTION_PERIOD.MONTH,
        })
        pricingRule = rule

        const [acquiringIntegration] = await createTestAcquiringIntegration(adminClient)
        await createTestAcquiringIntegrationContext(adminClient, recipientOrganization, acquiringIntegration, {
            invoiceStatus: CONTEXT_FINISHED_STATUS,
            invoiceRecipient: createTestRecipient(),
            invoiceImplicitFeeDistributionSchema: [],
        })
    })

    afterAll(() => {
        if (originalSubscriptionPaymentRecipient !== undefined) {
            process.env.SUBSCRIPTION_PAYMENT_RECIPIENT = originalSubscriptionPaymentRecipient
        } else {
            delete process.env.SUBSCRIPTION_PAYMENT_RECIPIENT
        }
    })

    describe('subscription context selection', () => {
        test('processes subscription context ending yesterday with recurrent payment enabled', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const paymentMethod = { id: faker.datatype.uuid(), type: 'card', last4: '1234' }
            const endAt = dayjs().subtract(2, 'days').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                recurrentPaymentEnabled: true,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                actualPaymentMethod: paymentMethod,
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
            
            const paymentMethod = { id: faker.datatype.uuid(), type: 'card', last4: '5678' }
            const endAt = dayjs().subtract(3, 'days').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                recurrentPaymentEnabled: true,
                startAt: dayjs().subtract(1, 'month').subtract(3, 'days').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                actualPaymentMethod: paymentMethod,
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
            
            const paymentMethod = { id: faker.datatype.uuid(), type: 'card', last4: '0000' }
            const endAt = dayjs().format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                recurrentPaymentEnabled: true,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                actualPaymentMethod: paymentMethod,
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
            
            const paymentMethod = { id: faker.datatype.uuid(), type: 'card', last4: '9999' }
            const endAt = dayjs().subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS + 1, 'days').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                recurrentPaymentEnabled: true,
                startAt: dayjs().subtract(1, 'month').subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS + 1, 'days').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                actualPaymentMethod: paymentMethod,
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

        test('does not process subscription context with recurrentPaymentEnabled: false', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const endAt = dayjs().format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                recurrentPaymentEnabled: false,
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
            
            const paymentMethod = { id: faker.datatype.uuid(), type: 'card', last4: '1111' }
            const endAt = dayjs().format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
                recurrentPaymentEnabled: true,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                actualPaymentMethod: paymentMethod,
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
                recurrentPaymentEnabled: true,
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
        test('processes only the latest subscription context for organization and pricing rule', async () => {
            const [organization] = await createTestOrganization(adminClient)
            
            const paymentMethod = { id: faker.datatype.uuid(), type: 'card', last4: '2222' }
            
            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                recurrentPaymentEnabled: true,
                startAt: dayjs().subtract(2, 'months').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                isTrial: false,
                actualPaymentMethod: paymentMethod,
                frozenPaymentInfo: {
                    pricingRuleId: pricingRule.id,
                    paymentMethod,
                },
            })

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                recurrentPaymentEnabled: true,
                startAt: dayjs().subtract(1, 'month').subtract(1, 'day').format('YYYY-MM-DD'),
                endAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                isTrial: false,
                actualPaymentMethod: paymentMethod,
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
            
            const paymentMethod = { id: faker.datatype.uuid(), type: 'card', last4: '3333' }
            const endAt = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                recurrentPaymentEnabled: true,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                actualPaymentMethod: paymentMethod,
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
