/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { PAYMENT_WITHDRAWN_STATUS } = require('@condo/domains/acquiring/constants/payment')
const { INSURANCE_BILLING_CATEGORY } = require('@condo/domains/acquiring/constants/recurrentPayment')
const { createTestAcquiringIntegration, createTestAcquiringIntegrationContext } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestPayment } = require('@condo/domains/acquiring/utils/testSchema')
const { CONTEXT_FINISHED_STATUS: BILLING_CONTEXT_FINISHED_STATUS } = require('@condo/domains/billing/constants/constants')
const { createTestBillingReceipt, createTestBillingProperty, createTestBillingAccount, createTestBillingIntegration, createTestBillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/testSchema')
const { SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { MESSAGE_FIELDS } = require('@condo/domains/notification/gql')
const { Message } = require('@condo/domains/notification/utils/serverSchema')
const { registerNewOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')
const { notifyResidentsOnPayday } = require('@condo/domains/resident/tasks/notifyResidentsOnPayday')
const { createTestResident, createTestServiceConsumer } = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithResidentUser } = require('@condo/domains/user/utils/testSchema')


const { keystone } = index

const getNewMessages = async ({ userId }) => {
    return await Message.getAll(keystone, {
        user: { id: userId },
        type: SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE,
    }, MESSAGE_FIELDS)
}

describe('Push notification on payday about unpaid receipts', () => {
    setFakeClientMode(index)
    describe('send push',  () => {
        let admin, context, property, billingProperty, account, period, acquiringContext, organization, insuranceAccount
        beforeAll(async () => {
            admin = await makeLoggedInAdminClient()
            period = dayjs().set('date', 1).subtract(2, 'month').format('YYYY-MM-DD')
            const [integration] = await createTestBillingIntegration(admin);
            [organization] = await registerNewOrganization(admin);
            [context] = await createTestBillingIntegrationOrganizationContext(admin, organization, integration, {
                status: BILLING_CONTEXT_FINISHED_STATUS,
                lastReport: {
                    period,
                    finishTime: dayjs().toISOString(),
                    totalReceipts: 100,
                },
            });
            [property] = await createTestProperty(admin, organization);
            [billingProperty] = await createTestBillingProperty(admin, context, { address: property.address, addressMeta: property.addressMeta });
            [account] = await createTestBillingAccount(admin, context, billingProperty);
            [insuranceAccount] = await createTestBillingAccount(admin, context, billingProperty)
            const [acquiringIntegration] = await createTestAcquiringIntegration(admin);
            [acquiringContext] = await createTestAcquiringIntegrationContext(admin, organization, acquiringIntegration, {
                status: CONTEXT_FINISHED_STATUS,
            })
        })

        it('has BillingReceipt with positive toPay field and has not Payments', async () => {
            const client = await makeClientWithResidentUser()
            const [resident] = await createTestResident(admin, client.user, property)
            await createTestServiceConsumer(admin, resident, organization, {
                accountNumber: account.number,
                acquiringIntegrationContext: { connect: { id: acquiringContext.id } },
            })
            await createTestBillingReceipt(admin, context, billingProperty, account, { period })
            await notifyResidentsOnPayday()
            const messages = await getNewMessages({ userId: client.user.id })
            expect(messages).toHaveLength(1)
        })

        it('do not notify for the insurance category', async () => {
            const client = await makeClientWithResidentUser()
            const [resident] = await createTestResident(admin, client.user, property)
            await createTestServiceConsumer(admin, resident, organization, {
                accountNumber: insuranceAccount.number,
                acquiringIntegrationContext: { connect: { id: acquiringContext.id } },
            })
            await createTestBillingReceipt(admin, context, billingProperty, insuranceAccount, { period, category: { connect: { id: INSURANCE_BILLING_CATEGORY } } })
            await notifyResidentsOnPayday()
            const messages = await getNewMessages({ userId: client.user.id })
            expect(messages).toHaveLength(0)
        })

        it('has several BillingReceipt with positive toPay field, different period and has not Payments', async () => {
            const client = await makeClientWithResidentUser()
            const [resident] = await createTestResident(admin, client.user, property)
            await createTestServiceConsumer(admin, resident, organization, {
                accountNumber: account.number,
                acquiringIntegrationContext: { connect: { id: acquiringContext.id } },
            })
            const closerPeriod = dayjs().subtract(1, 'month').set('date', 1).format('YYYY-MM-DD')
            await createTestBillingReceipt(admin, context, billingProperty, account, { period })
            await createTestBillingReceipt(admin, context, billingProperty, account, { period: closerPeriod })
            await createTestBillingReceipt(admin, context, billingProperty, account, { period: dayjs().subtract(3, 'month').set('date', 1).format('YYYY-MM-DD') })

            await notifyResidentsOnPayday()

            const messages = await getNewMessages({ userId: client.user.id })
            expect(messages).toHaveLength(1)
            expect(messages[0].uniqKey.slice(-10)).toEqual(closerPeriod)
        })

        it('has BillingReceipt with positive toPay field and has partial Payments', async () => {
            const client = await makeClientWithResidentUser()
            const [resident] = await createTestResident(admin, client.user, property)
            await createTestServiceConsumer(admin, resident, organization, {
                accountNumber: account.number,
                acquiringIntegrationContext: { connect: { id: acquiringContext.id } },
            })
            const [receipt] = await createTestBillingReceipt(admin, context, billingProperty, account, { period })

            await createTestPayment(admin, receipt.context.organization, receipt, acquiringContext, {
                accountNumber: account.number,
                amount: String(receipt.toPay / 2),
                status: PAYMENT_WITHDRAWN_STATUS,
            })

            await notifyResidentsOnPayday()

            const messages = await getNewMessages({ userId: client.user.id })
            expect(messages).toHaveLength(1)
        })
    })

    describe('dont send', function () {
        let admin, context, property, billingProperty, account, period, acquiringContext, organization
        beforeAll(async () => {
            admin = await makeLoggedInAdminClient()
            period = dayjs().set('date', 1).subtract(1, 'month').format('YYYY-MM-DD')
            const [integration] = await createTestBillingIntegration(admin);
            [organization] = await registerNewOrganization(admin);
            [context] = await createTestBillingIntegrationOrganizationContext(admin, organization, integration, {
                lastReport: {
                    period,
                    finishTime: dayjs().toISOString(),
                    totalReceipts: 100,
                },
            });
            [property] = await createTestProperty(admin, organization);
            [billingProperty] = await createTestBillingProperty(admin, context, { address: property.address, addressMeta: property.addressMeta });
            [account] = await createTestBillingAccount(admin, context, billingProperty)
            const [acquiringIntegration] = await createTestAcquiringIntegration(admin);
            [acquiringContext] = await createTestAcquiringIntegrationContext(admin, organization, acquiringIntegration, {
                status: CONTEXT_FINISHED_STATUS,
            })
        })

        it('has BillingReceipt with positive toPay field and has full Payment', async () => {
            const client = await makeClientWithResidentUser()
            const [resident] = await createTestResident(admin, client.user, property)
            await createTestServiceConsumer(admin, resident, organization, {
                accountNumber: account.number,
                acquiringIntegrationContext: { connect: { id: acquiringContext.id } },
            })
            const [receipt] = await createTestBillingReceipt(admin, context, billingProperty, account, { period })

            await createTestPayment(admin, receipt.context.organization, receipt, acquiringContext, {
                accountNumber: account.number,
                amount: String(receipt.toPay),
                status: PAYMENT_WITHDRAWN_STATUS,
                period,
            })

            await notifyResidentsOnPayday()

            const messages = await getNewMessages({ userId: client.user.id })

            expect(messages).toHaveLength(0)
        })
        
    })
})