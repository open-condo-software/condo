const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { WebhookPayload } = require('@open-condo/webhooks/schema/utils/testSchema')
const { encryptionManager } = require('@open-condo/webhooks/utils/encryption')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { MULTIPAYMENT_PROCESSING_STATUS } = require('@condo/domains/acquiring/constants/payment')
const { Payment, createTestAcquiringIntegration, createTestAcquiringIntegrationContext, updateTestMultiPayment } = require('@condo/domains/acquiring/utils/testSchema')
const { WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED } = require('@condo/domains/common/constants/webhooks')
const { INVOICE_STATUS_CANCELED, INVOICE_STATUS_PUBLISHED, INVOICE_STATUS_PAID, INVOICE_TYPE_B2B } = require('@condo/domains/marketplace/constants')
const { Invoice, createTestInvoice, updateTestInvoice } = require('@condo/domains/marketplace/utils/testSchema')
const { createTestOrganization, createTestOrganizationEmployeeRole, createTestOrganizationEmployee } = require('@condo/domains/organization/utils/testSchema')
const {
    SUBSCRIPTION_CONTEXT_STATUS,
    SUBSCRIPTION_WEBHOOK_REASON,
    SUBSCRIPTION_PERIOD,
    SUBSCRIPTION_PAYMENT_BUFFER_DAYS,
    SUBSCRIPTION_RENEWAL_INVOICE_LEAD_DAYS,
    SUBSCRIPTION_PAYMENT_TYPE_CARD,
    SUBSCRIPTION_PAYMENT_TYPE_INVOICE,
    SUBSCRIPTION_PLAN_TYPE_FEATURE,
} = require('@condo/domains/subscription/constants')
const { processRecurrentSubscriptionPayments } = require('@condo/domains/subscription/tasks/processRecurrentSubscriptionPayments')
const { SubscriptionPaymentAdapter } = require('@condo/domains/subscription/tasks/utils/SubscriptionPaymentAdapter')
const {
    createTestSubscriptionPlan,
    createTestSubscriptionPlanPricingRule,
    createTestSubscriptionContext,
    updateTestSubscriptionContext,
    registerSubscriptionContextsByTestClient,
    SubscriptionContext,
} = require('@condo/domains/subscription/utils/testSchema')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')


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
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
            })

            expect(newContexts).toHaveLength(2)
            const newInvoiceIds = new Set(newContexts.map(ctx => ctx.invoice.id))
            expect(newInvoiceIds.size).toBe(1)
            expect([...newInvoiceIds][0]).not.toBe(sharedInvoice.id)

            const newRuleIds = newContexts.map(ctx => ctx.subscriptionPlanPricingRule.id).sort()
            expect(newRuleIds).toEqual([pricingRule.id, featureRule.id].sort())
        })

        test('renews only the plans of a bundle that have not been renewed yet', async () => {
            const [organization] = await createTestOrganization(adminClient)
            const [payerOrganization] = await createTestOrganization(adminClient)

            await createTestAcquiringIntegrationContext(adminClient, organization, acquiringIntegration, {
                invoiceStatus: CONTEXT_FINISHED_STATUS,
            })

            const bindingId = faker.datatype.uuid()
            const startAt = dayjs().subtract(1, 'month').format('YYYY-MM-DD')
            const endAt = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

            const [sharedInvoice] = await createTestInvoice(adminClient, organization, {
                type: INVOICE_TYPE_B2B,
                status: INVOICE_STATUS_PAID,
                payerOrganization: { connect: { id: payerOrganization.id } },
            })

            const [serviceContext] = await createTestSubscriptionContext(adminClient, payerOrganization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                invoice: { connect: { id: sharedInvoice.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt,
                endAt,
                isTrial: false,
            })
            await createTestSubscriptionContext(adminClient, payerOrganization, featurePlan, {
                subscriptionPlanPricingRule: { connect: { id: featureRule.id } },
                invoice: { connect: { id: sharedInvoice.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt,
                endAt,
                isTrial: false,
            })

            await createTestSubscriptionContext(adminClient, payerOrganization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                startAt: endAt,
                endAt: dayjs(endAt).add(1, 'month').format('YYYY-MM-DD'),
                isTrial: false,
            })
            // the successor activation detaches the card; bring it back as if that step had failed
            await updateTestSubscriptionContext(adminClient, serviceContext.id, { bindingId })

            await processRecurrentSubscriptionPayments()

            const renewalContexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: payerOrganization.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.PENDING,
            })
            expect(renewalContexts).toHaveLength(1)
            expect(renewalContexts[0].subscriptionPlanPricingRule.id).toBe(featureRule.id)
        })
    })

    describe('existing renewal', () => {
        const createCardContext = async (organization, endAt) => {
            const bindingId = faker.datatype.uuid()
            await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                bindingId,
                startAt: dayjs(endAt).subtract(1, 'month').format('YYYY-MM-DD'),
                endAt,
                isTrial: false,
                frozenPaymentInfo: { pricingRuleId: pricingRule.id },
            })
        }

        const mockFailedPayment = () => jest.spyOn(SubscriptionPaymentAdapter, 'proceedPayment')
            .mockResolvedValue({ status: 'failed', paid: false, errorMessage: 'Payment failed' })

        // The cron renews every expiring bundle in the database, so only the charges of the organization under test count
        const chargesOf = (proceedPaymentSpy, organizationId) => proceedPaymentSpy.mock.calls
            .filter(([{ directPaymentUrl }]) => directPaymentUrl.includes(`organizationId=${organizationId}`))

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test('retries the charge on the same invoice while its payment has not started', async () => {
            const [organization] = await createTestOrganization(adminClient)
            await createCardContext(organization, dayjs().subtract(1, 'day').format('YYYY-MM-DD'))
            const proceedPaymentSpy = mockFailedPayment()

            await processRecurrentSubscriptionPayments()
            await processRecurrentSubscriptionPayments()

            expect(chargesOf(proceedPaymentSpy, organization.id)).toHaveLength(2)
            const invoices = await Invoice.getAll(adminClient, { payerOrganization: { id: organization.id } })
            expect(invoices).toHaveLength(1)
            const payments = await Payment.getAll(adminClient, { invoice: { id: invoices[0].id } })
            expect(new Set(payments.map(payment => payment.multiPayment.id)).size).toBe(1)
        })

        test('does not charge again once the gateway started the renewal payment', async () => {
            const [organization] = await createTestOrganization(adminClient)
            await createCardContext(organization, dayjs().subtract(1, 'day').format('YYYY-MM-DD'))
            const proceedPaymentSpy = mockFailedPayment()

            await processRecurrentSubscriptionPayments()
            const [invoice] = await Invoice.getAll(adminClient, { payerOrganization: { id: organization.id } })
            const [payment] = await Payment.getAll(adminClient, { invoice: { id: invoice.id } })
            // what b2b-payments-gateway does on a charge; payments turn DONE only when the provider webhook lands
            await updateTestMultiPayment(adminClient, payment.multiPayment.id, { status: MULTIPAYMENT_PROCESSING_STATUS })

            await processRecurrentSubscriptionPayments()

            expect(chargesOf(proceedPaymentSpy, organization.id)).toHaveLength(1)
        })

        test('does not charge the card for a renewal registered to be paid by bank transfer', async () => {
            const [organization] = await createTestOrganization(adminClient)
            await createCardContext(organization, dayjs().subtract(1, 'day').format('YYYY-MM-DD'))
            await registerSubscriptionContextsByTestClient(adminClient, {
                organization: { id: organization.id },
                subscriptionPlanPricingRules: [{ id: pricingRule.id }],
                paymentType: 'invoice',
            })
            const proceedPaymentSpy = mockFailedPayment()

            await processRecurrentSubscriptionPayments()

            expect(chargesOf(proceedPaymentSpy, organization.id)).toHaveLength(0)
            const invoices = await Invoice.getAll(adminClient, { payerOrganization: { id: organization.id } })
            expect(invoices).toHaveLength(1)
        })

        test('closes a renewal whose invoice was cancelled and registers a new one', async () => {
            const [organization] = await createTestOrganization(adminClient)
            await createCardContext(organization, dayjs().subtract(1, 'day').format('YYYY-MM-DD'))
            const proceedPaymentSpy = mockFailedPayment()

            await processRecurrentSubscriptionPayments()
            const [cancelledInvoice] = await Invoice.getAll(adminClient, { payerOrganization: { id: organization.id } })
            await updateTestInvoice(adminClient, cancelledInvoice.id, { status: INVOICE_STATUS_CANCELED })

            await processRecurrentSubscriptionPayments()

            expect(chargesOf(proceedPaymentSpy, organization.id)).toHaveLength(2)
            const closedContexts = await SubscriptionContext.getAll(adminClient, { invoice: { id: cancelledInvoice.id } })
            expect(closedContexts.every(ctx => ctx.status === SUBSCRIPTION_CONTEXT_STATUS.ERROR)).toBe(true)
            const invoices = await Invoice.getAll(adminClient, { payerOrganization: { id: organization.id } })
            expect(invoices).toHaveLength(2)
        })

        test('cancels the invoice when the renewal fails on the last buffer day', async () => {
            const [organization] = await createTestOrganization(adminClient)
            await createCardContext(organization, dayjs().subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS, 'days').format('YYYY-MM-DD'))
            mockFailedPayment()

            await processRecurrentSubscriptionPayments()

            const renewalContexts = await SubscriptionContext.getAll(adminClient, {
                organization: { id: organization.id },
                status: SUBSCRIPTION_CONTEXT_STATUS.ERROR,
            })
            expect(renewalContexts).toHaveLength(1)
            const [invoice] = await Invoice.getAll(adminClient, { id: renewalContexts[0].invoice.id })
            expect(invoice.status).toBe(INVOICE_STATUS_CANCELED)
        })
    })

    describe('renewal invoices', () => {
        let acquiringIntegration
        const previousWebhookEnv = {}
        // every subscription webhook shares this one url/secret - eventType in the payload tells them apart
        const WEBHOOK_ENV = {
            SUBSCRIPTION_WEBHOOK_URL: 'https://subscription-webhook.example.com/webhook',
            SUBSCRIPTION_WEBHOOK_SECRET: 'subscription-webhook-secret',
        }

        beforeAll(async () => {
            const [integration] = await createTestAcquiringIntegration(adminClient, { canGroupReceipts: true })
            acquiringIntegration = integration

            for (const [key, value] of Object.entries(WEBHOOK_ENV)) {
                previousWebhookEnv[key] = process.env[key]
                process.env[key] = value
            }
        })

        afterAll(() => {
            for (const [key, value] of Object.entries(previousWebhookEnv)) {
                if (value === undefined) delete process.env[key]
                else process.env[key] = value
            }
        })

        const createInvoicePaidContext = async (organization, extraAttrs = {}) => {
            const [payee] = await createTestOrganization(adminClient)
            await createTestAcquiringIntegrationContext(adminClient, payee, acquiringIntegration, { invoiceStatus: CONTEXT_FINISHED_STATUS })
            const [invoice] = await createTestInvoice(adminClient, payee, {
                type: INVOICE_TYPE_B2B,
                status: INVOICE_STATUS_PAID,
                payerOrganization: { connect: { id: organization.id } },
            })
            const [subscriptionContext] = await createTestSubscriptionContext(adminClient, organization, subscriptionPlan, {
                subscriptionPlanPricingRule: { connect: { id: pricingRule.id } },
                invoice: { connect: { id: invoice.id } },
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt: dayjs().add(3, 'days').format('YYYY-MM-DD'),
                isTrial: false,
                frozenPaymentInfo: { pricingRuleId: pricingRule.id, paymentType: SUBSCRIPTION_PAYMENT_TYPE_INVOICE },
                ...extraAttrs,
            })
            return subscriptionContext
        }

        const findRenewals = (organization) => SubscriptionContext.getAll(adminClient, {
            organization: { id: organization.id },
            status: SUBSCRIPTION_CONTEXT_STATUS.CREATED,
        })

        test('issues the invoice for the next period once a period paid by invoice is about to end', async () => {
            const [organization] = await createTestOrganization(adminClient)
            const paidContext = await createInvoicePaidContext(organization)

            await processRecurrentSubscriptionPayments()

            const renewals = await findRenewals(organization)
            expect(renewals).toHaveLength(1)
            expect(renewals[0]).toMatchObject({
                subscriptionPlanPricingRule: { id: pricingRule.id },
                startAt: paidContext.endAt,
                frozenPaymentInfo: expect.objectContaining({ paymentType: SUBSCRIPTION_PAYMENT_TYPE_INVOICE }),
            })
        })

        test('attaches the organization\'s own manager, not Doma staff, as the user on the auto-issued invoice webhook', async () => {
            const [organization] = await createTestOrganization(adminClient)

            const [role] = await createTestOrganizationEmployeeRole(adminClient, organization, { canManageSubscriptions: true })
            const manager = await makeClientWithNewRegisteredAndLoggedInUser()
            await createTestOrganizationEmployee(adminClient, organization, manager.user, role)

            // the manager registers for real, so the context's createdBy is a genuine client user, not admin/support
            const [registered] = await registerSubscriptionContextsByTestClient(manager, {
                organization: { id: organization.id },
                subscriptionPlanPricingRules: [{ id: pricingRule.id }],
                paymentType: 'invoice',
            })
            const [originalContext] = registered.subscriptionContexts

            // only admin can flip the status directly; this only fakes the period having already run its course
            await updateTestSubscriptionContext(adminClient, originalContext.id, {
                status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                startAt: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
                endAt: dayjs().add(SUBSCRIPTION_RENEWAL_INVOICE_LEAD_DAYS, 'days').format('YYYY-MM-DD'),
            })

            await processRecurrentSubscriptionPayments()

            const renewals = await findRenewals(organization)
            expect(renewals).toHaveLength(1)

            const [webhookPayload] = await WebhookPayload.getAll(adminClient, {
                eventType: WEBHOOK_EVENT_SUBSCRIPTION_INVOICE_REQUESTED,
                itemId_in: [renewals[0].id],
            })
            const payload = JSON.parse(encryptionManager.decrypt(webhookPayload.payload))
            expect(payload.user.id).toBe(manager.user.id)
            expect(payload.reason).toBe(SUBSCRIPTION_WEBHOOK_REASON.RENEWAL)
        })

        test('issues it only once', async () => {
            const [organization] = await createTestOrganization(adminClient)
            await createInvoicePaidContext(organization)

            await processRecurrentSubscriptionPayments()
            await processRecurrentSubscriptionPayments()

            expect(await findRenewals(organization)).toHaveLength(1)
        })

        test('leaves alone the periods that end later, were removed from the subscription or were paid by card', async () => {
            const [organization] = await createTestOrganization(adminClient)
            await createInvoicePaidContext(organization, { endAt: dayjs().add(SUBSCRIPTION_RENEWAL_INVOICE_LEAD_DAYS + 1, 'days').format('YYYY-MM-DD') })

            const [removedOrganization] = await createTestOrganization(adminClient)
            const removedContext = await createInvoicePaidContext(removedOrganization)
            await updateTestSubscriptionContext(adminClient, removedContext.id, { renewalCancelledAt: dayjs().toISOString() })

            const [cardOrganization] = await createTestOrganization(adminClient)
            await createInvoicePaidContext(cardOrganization, {
                frozenPaymentInfo: { pricingRuleId: pricingRule.id, paymentType: SUBSCRIPTION_PAYMENT_TYPE_CARD },
            })

            await processRecurrentSubscriptionPayments()

            expect(await findRenewals(organization)).toHaveLength(0)
            expect(await findRenewals(removedOrganization)).toHaveLength(0)
            expect(await findRenewals(cardOrganization)).toHaveLength(0)
        })
    })
})
