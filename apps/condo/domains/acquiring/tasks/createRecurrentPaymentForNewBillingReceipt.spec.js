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
    RECURRENT_PAYMENT_INIT_STATUS,
    INSURANCE_BILLING_CATEGORY,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    makePayerWithMultipleConsumers,
    createTestRecurrentPaymentContext,
    RecurrentPayment,
} = require('@condo/domains/acquiring/utils/testSchema')
const { updateTestBillingReceipt } = require('@condo/domains/billing/utils/testSchema')
const { DATE_FORMAT, DATE_FORMAT_Z } = require('@condo/domains/common/utils/date')
const {
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_LIMIT_EXCEED_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { MESSAGE_FIELDS } = require('@condo/domains/notification/gql')
const {
    Message,
} = require('@condo/domains/notification/utils/serverSchema')

const {
    scanBillingReceiptsForRecurrentPaymentContext,
} = require('./createRecurrentPaymentForNewBillingReceipt')

const { keystone } = index

describe('create-recurrent-payment-for-new-billing-receipt', () => {
    let adminContext, admin, getContextRequest
    setFakeClientMode(index)

    beforeAll(async () => {
        adminContext = await keystone.createContext({ skipAccessControl: true })

        admin = await makeLoggedInAdminClient()

        getContextRequest = (batch) => ({
            enabled: false,
            limit: '100000000',
            autoPayReceipts: true,
            paymentDay: null,
            settings: { cardId: faker.datatype.uuid() },
            serviceConsumer: { connect: { id: batch.serviceConsumer.id } },
            billingCategory: { connect: { id: batch.billingReceipts[0].category.id } },
        })
    })

    it('should create RecurrentPayment - lastDt is start of the month, period - this month', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const lastDt = dayjs(period).startOf('month')
        const lastDtString = lastDt.format(DATE_FORMAT)
        const periods = [lastDt.subtract(1, 'months').format(DATE_FORMAT), lastDtString]
        const tomorrowMidnight = dayjs().add(1, 'days').startOf('day')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await scanBillingReceiptsForRecurrentPaymentContext(adminContext, recurrentPaymentContext, periods, lastDtString)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment).toHaveProperty('status')
        expect(recurrentPayment).toHaveProperty('tryCount')
        expect(recurrentPayment).toHaveProperty('state')
        expect(recurrentPayment).toHaveProperty('payAfter')
        expect(recurrentPayment).toHaveProperty('billingReceipts')
        expect(recurrentPayment).toHaveProperty('recurrentPaymentContext')

        expect(recurrentPayment.status).toEqual(RECURRENT_PAYMENT_INIT_STATUS)
        expect(recurrentPayment.payAfter).toEqual(tomorrowMidnight.toISOString())
        expect(recurrentPayment.tryCount).toEqual(0)
        expect(recurrentPayment.state).toBeDefined()
        expect(recurrentPayment.billingReceipts).toHaveLength(2)

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[0].id)
        expect(ids).toContain(billingReceipts[1].id)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, MESSAGE_FIELDS, {
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

    it('should create RecurrentPayment - lastDt is start of the month, period - prev month', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const lastDt = dayjs(period).startOf('month')
        const lastDtString = lastDt.format(DATE_FORMAT)
        const periods = [lastDt.add(1, 'months').format(DATE_FORMAT), lastDtString]
        const tomorrowMidnight = dayjs().add(1, 'days').startOf('day')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await scanBillingReceiptsForRecurrentPaymentContext(adminContext, recurrentPaymentContext, periods, lastDtString)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment).toHaveProperty('status')
        expect(recurrentPayment).toHaveProperty('tryCount')
        expect(recurrentPayment).toHaveProperty('state')
        expect(recurrentPayment).toHaveProperty('payAfter')
        expect(recurrentPayment).toHaveProperty('billingReceipts')
        expect(recurrentPayment).toHaveProperty('recurrentPaymentContext')

        expect(recurrentPayment.status).toEqual(RECURRENT_PAYMENT_INIT_STATUS)
        expect(recurrentPayment.payAfter).toEqual(tomorrowMidnight.toISOString())
        expect(recurrentPayment.tryCount).toEqual(0)
        expect(recurrentPayment.state).toBeDefined()
        expect(recurrentPayment.billingReceipts).toHaveLength(2)

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[0].id)
        expect(ids).toContain(billingReceipts[1].id)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, MESSAGE_FIELDS, {
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
            url: `${conf.SERVER_URL}/payments/`,
        })
    })

    it('should create RecurrentPayment - lastDt less than createdAt', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period, createdAt }] = billingReceipts
        const lastDt = dayjs(createdAt).startOf('day')
        const periodDt = dayjs(period).startOf('month')
        const lastDtString = lastDt.format(DATE_FORMAT)
        const periods = [periodDt.add(1, 'months').format(DATE_FORMAT), periodDt.format(DATE_FORMAT)]
        const tomorrowMidnight = dayjs().add(1, 'days').startOf('day')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await scanBillingReceiptsForRecurrentPaymentContext(adminContext, recurrentPaymentContext, periods, lastDtString)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment).toHaveProperty('status')
        expect(recurrentPayment).toHaveProperty('tryCount')
        expect(recurrentPayment).toHaveProperty('state')
        expect(recurrentPayment).toHaveProperty('payAfter')
        expect(recurrentPayment).toHaveProperty('billingReceipts')
        expect(recurrentPayment).toHaveProperty('recurrentPaymentContext')

        expect(recurrentPayment.status).toEqual(RECURRENT_PAYMENT_INIT_STATUS)
        expect(recurrentPayment.payAfter).toEqual(tomorrowMidnight.toISOString())
        expect(recurrentPayment.tryCount).toEqual(0)
        expect(recurrentPayment.state).toBeDefined()
        expect(recurrentPayment.billingReceipts).toHaveLength(2)

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[0].id)
        expect(ids).toContain(billingReceipts[1].id)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, MESSAGE_FIELDS, {
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
            url: `${conf.SERVER_URL}/payments/`,
        })
    })

    it('should create RecurrentPayment - lastDt date time zoned format', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period, createdAt }] = billingReceipts
        const lastDt = dayjs(createdAt).startOf('day')
        const periodDt = dayjs(period).startOf('month')
        const lastDtString = lastDt.format(DATE_FORMAT_Z)
        const periods = [periodDt.add(1, 'months').format(DATE_FORMAT), periodDt.format(DATE_FORMAT)]
        const tomorrowMidnight = dayjs().add(1, 'days').startOf('day')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await scanBillingReceiptsForRecurrentPaymentContext(adminContext, recurrentPaymentContext, periods, lastDtString)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment).toHaveProperty('status')
        expect(recurrentPayment).toHaveProperty('tryCount')
        expect(recurrentPayment).toHaveProperty('state')
        expect(recurrentPayment).toHaveProperty('payAfter')
        expect(recurrentPayment).toHaveProperty('billingReceipts')
        expect(recurrentPayment).toHaveProperty('recurrentPaymentContext')

        expect(recurrentPayment.status).toEqual(RECURRENT_PAYMENT_INIT_STATUS)
        expect(recurrentPayment.payAfter).toEqual(tomorrowMidnight.toISOString())
        expect(recurrentPayment.tryCount).toEqual(0)
        expect(recurrentPayment.state).toBeDefined()
        expect(recurrentPayment.billingReceipts).toHaveLength(2)

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[0].id)
        expect(ids).toContain(billingReceipts[1].id)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, MESSAGE_FIELDS, {
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
            url: `${conf.SERVER_URL}/payments/`,
        })
    })

    it('should create RecurrentPayment - lastDt iso format', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period, createdAt }] = billingReceipts
        const lastDt = dayjs(createdAt).startOf('day')
        const periodDt = dayjs(period).startOf('month')
        const lastDtString = lastDt.toISOString()
        const periods = [periodDt.add(1, 'months').format(DATE_FORMAT), periodDt.format(DATE_FORMAT)]
        const tomorrowMidnight = dayjs().add(1, 'days').startOf('day')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await scanBillingReceiptsForRecurrentPaymentContext(adminContext, recurrentPaymentContext, periods, lastDtString)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment).toHaveProperty('status')
        expect(recurrentPayment).toHaveProperty('tryCount')
        expect(recurrentPayment).toHaveProperty('state')
        expect(recurrentPayment).toHaveProperty('payAfter')
        expect(recurrentPayment).toHaveProperty('billingReceipts')
        expect(recurrentPayment).toHaveProperty('recurrentPaymentContext')

        expect(recurrentPayment.status).toEqual(RECURRENT_PAYMENT_INIT_STATUS)
        expect(recurrentPayment.payAfter).toEqual(tomorrowMidnight.toISOString())
        expect(recurrentPayment.tryCount).toEqual(0)
        expect(recurrentPayment.state).toBeDefined()
        expect(recurrentPayment.billingReceipts).toHaveLength(2)

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[0].id)
        expect(ids).toContain(billingReceipts[1].id)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, MESSAGE_FIELDS, {
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
            url: `${conf.SERVER_URL}/payments/`,
        })
    })

    it('should create RecurrentPayment - limit exceeded', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period, createdAt }] = billingReceipts
        const lastDt = dayjs(createdAt).startOf('day')
        const periodDt = dayjs(period).startOf('month')
        const lastDtString = lastDt.toISOString()
        const periods = [periodDt.add(1, 'months').format(DATE_FORMAT), periodDt.format(DATE_FORMAT)]
        const tomorrowMidnight = dayjs().add(1, 'days').startOf('day')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
            limit: '0.01',
        })

        // create recurrent payments
        await scanBillingReceiptsForRecurrentPaymentContext(adminContext, recurrentPaymentContext, periods, lastDtString)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment).toHaveProperty('status')
        expect(recurrentPayment).toHaveProperty('tryCount')
        expect(recurrentPayment).toHaveProperty('state')
        expect(recurrentPayment).toHaveProperty('payAfter')
        expect(recurrentPayment).toHaveProperty('billingReceipts')
        expect(recurrentPayment).toHaveProperty('recurrentPaymentContext')

        expect(recurrentPayment.status).toEqual(RECURRENT_PAYMENT_INIT_STATUS)
        expect(recurrentPayment.payAfter).toEqual(tomorrowMidnight.toISOString())
        expect(recurrentPayment.tryCount).toEqual(0)
        expect(recurrentPayment.state).toBeDefined()
        expect(recurrentPayment.billingReceipts).toHaveLength(2)

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[0].id)
        expect(ids).toContain(billingReceipts[1].id)

        const [notification] = await Message.getAll(adminContext, {
            type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_LIMIT_EXCEED_MESSAGE_TYPE,
            user: { id: batch.resident.user.id },
        }, MESSAGE_FIELDS, {
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

    it('should not create RecurrentPayment - no receipts for period', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period, createdAt }] = billingReceipts
        const lastDt = dayjs(createdAt).startOf('day')
        const periodDt = dayjs(period).startOf('month')
        const lastDtString = lastDt.format(DATE_FORMAT)
        const periods = [periodDt.add(2, 'months').format(DATE_FORMAT), periodDt.add(1, 'months').format(DATE_FORMAT)]

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await scanBillingReceiptsForRecurrentPaymentContext(adminContext, recurrentPaymentContext, periods, lastDtString)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(0)
    })

    it('should not create RecurrentPayment - last dt is bigger than created at', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const periodDt = dayjs(period).startOf('month')
        const lastDtString = dayjs().add(1, 'day').format(DATE_FORMAT)
        const periods = [periodDt.format(DATE_FORMAT), periodDt.add(1, 'months').format(DATE_FORMAT)]

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await scanBillingReceiptsForRecurrentPaymentContext(adminContext, recurrentPaymentContext, periods, lastDtString)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(0)
    })

    // TODO DOMA-11572
    it('should not create RecurrentPayment for INSURANCE category', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period, createdAt }] = billingReceipts
        const lastDt = dayjs(createdAt).startOf('day')
        const periodDt = dayjs(period).startOf('month')
        const lastDtString = lastDt.toISOString()
        const periods = [periodDt.add(1, 'months').format(DATE_FORMAT), periodDt.format(DATE_FORMAT)]

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
            billingCategory: null,
        })

        await updateTestBillingReceipt(admin, billingReceipts[0].id, { category: { connect: { id: INSURANCE_BILLING_CATEGORY } } })

        // create recurrent payments
        await scanBillingReceiptsForRecurrentPaymentContext(adminContext, recurrentPaymentContext, periods, lastDtString)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment.billingReceipts).toHaveLength(1) // without updated billingReceipts[0]

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[1].id)
    })
})
