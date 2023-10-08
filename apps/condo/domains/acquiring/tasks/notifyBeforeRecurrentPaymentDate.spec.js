/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const {
    setFakeClientMode,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    PAYMENT_DONE_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    RECURRENT_PAYMENT_INIT_STATUS,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    Payment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const {
    makePayerWithMultipleConsumers,
    createTestRecurrentPaymentContext,
    registerMultiPaymentByTestClient,
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_NO_RECEIPTS_MESSAGE_TYPE,
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_LIMIT_EXCEED_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const {
    Message,
} = require('@condo/domains/notification/utils/serverSchema')

const {
    notifyRecurrentPaymentContext,
} = require('./notifyBeforeRecurrentPaymentDate')


const { keystone } = index
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'test-fingerprint-alphanumeric-value' } }

describe('notify-before-recurrent-payment-date', () => {
    let adminContext, admin, getContextRequest, getPaymentRequest
    setFakeClientMode(index)

    beforeAll(async () => {
        adminContext = await keystone.createContext({ skipAccessControl: true })

        admin = await makeLoggedInAdminClient()

        getContextRequest = (batch) => ({
            enabled: false,
            limit: '100000000',
            autoPayReceipts: false,
            paymentDay: dayjs().date(),
            settings: { cardId: faker.datatype.uuid() },
            serviceConsumer: { connect: { id: batch.serviceConsumer.id } },
            billingCategory: { connect: { id: batch.billingReceipts[0].category.id } },
        })

        getPaymentRequest = (batch, recurrentPaymentContext) => ({
            payAfter: null,
            tryCount: 0,
            status: RECURRENT_PAYMENT_INIT_STATUS,
            state: {},
            billingReceipts: batch.billingReceipts.map(receipt => ({ id: receipt.id })),
            recurrentPaymentContext: { connect: { id: recurrentPaymentContext.id } },
        })
    })

    it('should create notification - receipts exists', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period)

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // send notification
        await notifyRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, {
            sortBy: 'createdAt_DESC',
        })
        expect(notification).toBeDefined()
        expect(notification).toHaveProperty('user')
        expect(notification.user).toHaveProperty('id')
        expect(notification.user.id).toEqual(batch.resident.user.id)
        expect(notification).toHaveProperty('meta')
        expect(notification.meta).toHaveProperty('data')
        expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
        expect(notification.meta.data).toHaveProperty('serviceConsumerId')
        expect(notification.meta.data).toHaveProperty('residentId')
        expect(notification.meta.data).toHaveProperty('userId')

        expect(notification.meta.data).toMatchObject({
            recurrentPaymentContextId: recurrentPaymentContext.id,
            serviceConsumerId: batch.serviceConsumer.id,
            residentId: batch.resident.id,
            userId: batch.resident.user.id,
        })
    })

    it('should create no receipt notification - no receipts for date', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period).add(3, 'month')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // send notification
        await notifyRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_NO_RECEIPTS_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, {
            sortBy: 'createdAt_DESC',
        })
        expect(notification).toBeDefined()
        expect(notification).toHaveProperty('user')
        expect(notification.user).toHaveProperty('id')
        expect(notification.user.id).toEqual(batch.resident.user.id)
        expect(notification).toHaveProperty('meta')
        expect(notification.meta).toHaveProperty('data')
        expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
        expect(notification.meta.data).toHaveProperty('serviceConsumerId')
        expect(notification.meta.data).toHaveProperty('residentId')
        expect(notification.meta.data).toHaveProperty('userId')

        expect(notification.meta.data).toMatchObject({
            recurrentPaymentContextId: recurrentPaymentContext.id,
            serviceConsumerId: batch.serviceConsumer.id,
            residentId: batch.resident.id,
            userId: batch.resident.user.id,
        })
    })

    it('should create notification - one receipt are paid', async () => {
        const { commonData, batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period)

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // register multi payment
        const [result] = await registerMultiPaymentByTestClient(commonData.client, [{
            serviceConsumer: { id: batch.serviceConsumer.id },
            receipts: billingReceipts.map(receipt => ({ id: receipt.id })),
        }])
        expect(result).toBeDefined()
        expect(result).toHaveProperty('dv', 1)
        expect(result).toHaveProperty('multiPaymentId')

        // get payments
        const payments = await Payment.getAll(adminContext, {
            multiPayment: {
                id: result.multiPaymentId,
            },
        })
        expect(payments).toBeDefined()
        expect(payments).toHaveLength(billingReceipts.length)

        // mark payment as payed
        await Payment.update(adminContext, payments[0].id, {
            ...dvAndSender,
            status: PAYMENT_DONE_STATUS,
            advancedAt: dayjs().toISOString(),
        })

        // send notification
        await notifyRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, {
            sortBy: 'createdAt_DESC',
        })
        expect(notification).toBeDefined()
        expect(notification).toHaveProperty('user')
        expect(notification.user).toHaveProperty('id')
        expect(notification.user.id).toEqual(batch.resident.user.id)
        expect(notification).toHaveProperty('meta')
        expect(notification.meta).toHaveProperty('data')
        expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
        expect(notification.meta.data).toHaveProperty('serviceConsumerId')
        expect(notification.meta.data).toHaveProperty('residentId')
        expect(notification.meta.data).toHaveProperty('userId')

        expect(notification.meta.data).toMatchObject({
            recurrentPaymentContextId: recurrentPaymentContext.id,
            serviceConsumerId: batch.serviceConsumer.id,
            residentId: batch.resident.id,
            userId: batch.resident.user.id,
        })
    })

    it('should create no receipt notification - all receipt are paid', async () => {
        const { commonData, batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period)

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // register multi payment
        const [result] = await registerMultiPaymentByTestClient(commonData.client, [{
            serviceConsumer: { id: batch.serviceConsumer.id },
            receipts: billingReceipts.map(receipt => ({ id: receipt.id })),
        }])
        expect(result).toBeDefined()
        expect(result).toHaveProperty('dv', 1)
        expect(result).toHaveProperty('multiPaymentId')

        // get payments
        const payments = await Payment.getAll(adminContext, {
            multiPayment: {
                id: result.multiPaymentId,
            },
        })
        expect(payments).toBeDefined()
        expect(payments).toHaveLength(billingReceipts.length)

        // mark payment as payed
        for (const payment of payments) {
            await Payment.update(adminContext, payment.id, {
                ...dvAndSender,
                status: PAYMENT_DONE_STATUS,
                advancedAt: dayjs().toISOString(),
            })
        }

        // send notification
        await notifyRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_NO_RECEIPTS_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, {
            sortBy: 'createdAt_DESC',
        })
        expect(notification).toBeDefined()
        expect(notification).toHaveProperty('user')
        expect(notification.user).toHaveProperty('id')
        expect(notification.user.id).toEqual(batch.resident.user.id)
        expect(notification).toHaveProperty('meta')
        expect(notification.meta).toHaveProperty('data')
        expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
        expect(notification.meta.data).toHaveProperty('serviceConsumerId')
        expect(notification.meta.data).toHaveProperty('residentId')
        expect(notification.meta.data).toHaveProperty('userId')

        expect(notification.meta.data).toMatchObject({
            recurrentPaymentContextId: recurrentPaymentContext.id,
            serviceConsumerId: batch.serviceConsumer.id,
            residentId: batch.resident.id,
            userId: batch.resident.user.id,
        })
    })

    it('should create notification - limit exceeded', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period)

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
            limit: '0.01',
        })

        // send notification
        await notifyRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_LIMIT_EXCEED_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, {
            sortBy: 'createdAt_DESC',
        })
        expect(notification).toBeDefined()
        expect(notification).toHaveProperty('user')
        expect(notification.user).toHaveProperty('id')
        expect(notification.user.id).toEqual(batch.resident.user.id)
        expect(notification).toHaveProperty('meta')
        expect(notification.meta).toHaveProperty('data')
        expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
        expect(notification.meta.data).toHaveProperty('serviceConsumerId')
        expect(notification.meta.data).toHaveProperty('residentId')
        expect(notification.meta.data).toHaveProperty('userId')
        expect(notification.meta.data).toHaveProperty('toPayAmount')

        expect(notification.meta.data).toMatchObject({
            recurrentPaymentContextId: recurrentPaymentContext.id,
            serviceConsumerId: batch.serviceConsumer.id,
            residentId: batch.resident.id,
            userId: batch.resident.user.id,
            url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}/`,
        })
    })
})