/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { PAYMENT_WITHDRAWN_STATUS } = require('@condo/domains/acquiring/constants/payment')
const { createTestAcquiringIntegration, createTestAcquiringIntegrationContext } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestPayment } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestBillingReceipt, createTestBillingProperty, createTestBillingAccount, createTestBillingIntegration, createTestBillingIntegrationOrganizationContext } = require('@condo/domains/billing/utils/testSchema')
const { SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
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
    })
}

describe('Push notification on payday about unpaid receipts', () => {
    setFakeClientMode(index)
    describe('send push',  () => {
        let admin, client, resident, consumer, context, property, billingProperty, account, period, acquiringContext
        beforeAll(async () => {
            admin = await makeLoggedInAdminClient()
            client = await makeClientWithResidentUser()
            const [integration] = await createTestBillingIntegration(admin)
            const [organization] = await registerNewOrganization(admin);
            [context] = await createTestBillingIntegrationOrganizationContext(admin, organization, integration);
            [property] = await createTestProperty(admin, organization);
            [billingProperty] = await createTestBillingProperty(admin, context, { address: property.address, addressMeta: property.addressMeta });
            [account] = await createTestBillingAccount(admin, context, billingProperty);
            [resident] = await createTestResident(admin, client.user, property);
            [consumer] = await createTestServiceConsumer(admin, resident, organization, { accountNumber: account.number })
            const [acquiringIntegration] = await createTestAcquiringIntegration(admin);
            [acquiringContext] = await createTestAcquiringIntegrationContext(admin, organization, acquiringIntegration)
            period = dayjs().set('date', 1).subtract(1, 'month').format('YYYY-MM-DD')
        })

        it('has BillingReceipt with positive toPay field and has not Payments', async () => {
            const [receipt] = await createTestBillingReceipt(admin, context, billingProperty, account, { period })

            await notifyResidentsOnPayday()

            const messages = await getNewMessages({ userId: client.user.id })

            expect(messages).toHaveLength(1)

            await Message.softDelete(keystone, messages[0].id, { dv: 1, sender: { dv: 1, fingerprint: 'tests' } })
        })
        
        it('has BillingReceipt with positive toPay field and has partial Payments', async () => {
            const [receipt] = await createTestBillingReceipt(admin, context, billingProperty, account, { period })

            const [payment] = await createTestPayment(admin, receipt.context.organization, receipt, acquiringContext, {
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
        let admin, client, resident, consumer, context, property, billingProperty, account, period, acquiringContext
        beforeAll(async () => {
            admin = await makeLoggedInAdminClient()
            client = await makeClientWithResidentUser()
            const [integration] = await createTestBillingIntegration(admin)
            const [organization] = await registerNewOrganization(admin);
            [context] = await createTestBillingIntegrationOrganizationContext(admin, organization, integration);
            [property] = await createTestProperty(admin, organization);
            [billingProperty] = await createTestBillingProperty(admin, context, { address: property.address, addressMeta: property.addressMeta });
            [account] = await createTestBillingAccount(admin, context, billingProperty);
            [resident] = await createTestResident(admin, client.user, property);
            [consumer] = await createTestServiceConsumer(admin, resident, organization, { accountNumber: account.number })
            const [acquiringIntegration] = await createTestAcquiringIntegration(admin);
            [acquiringContext] = await createTestAcquiringIntegrationContext(admin, organization, acquiringIntegration)
            period = dayjs().set('date', 1).subtract(1, 'month').format('YYYY-MM-DD')
        })

        it('has BillingReceipt with positive toPay field and has full Payment', async () => {
            const [receipt] = await createTestBillingReceipt(admin, context, billingProperty, account, { period })

            const [payment] = await createTestPayment(admin, receipt.context.organization, receipt, acquiringContext, {
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