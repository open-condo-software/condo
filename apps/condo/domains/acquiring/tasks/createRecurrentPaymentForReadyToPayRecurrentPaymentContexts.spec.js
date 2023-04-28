/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const {
    setFakeClientMode,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    RECURRENT_PAYMENT_INIT_STATUS,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    makePayerWithMultipleConsumers,
    createTestRecurrentPaymentContext,
    RecurrentPayment,
} = require('@condo/domains/acquiring/utils/testSchema')

const {
    createRecurrentPaymentForRecurrentPaymentContext,
} = require('./createRecurrentPaymentForReadyToPayRecurrentPaymentContexts')


const { keystone } = index

describe('create-recurrent-payment-for-ready-to-pay-recurrent-payment-contexts', () => {
    let adminContext, admin, getContextRequest
    setFakeClientMode(index)

    beforeAll(async () => {
        adminContext = await keystone.createContext({ skipAccessControl: true })

        admin = await makeLoggedInAdminClient()

        getContextRequest = (batch) => ({
            enabled: false,
            limit: '10000',
            autoPayReceipts: false,
            paymentDay: dayjs().date(),
            settings: { cardId: faker.datatype.uuid() },
            serviceConsumer: { connect: { id: batch.serviceConsumer.id } },
            billingCategory: { connect: { id: batch.billingReceipts[0].category.id } },
        })
    })

    it('should create RecurrentPayment', async () => {
        const { batches } = await makePayerWithMultipleConsumers(1, 2)
        const [batch] = batches
        const {
            billingReceipts,
        } = batch
        const [{ period }] = billingReceipts
        const today = dayjs(period).startOf('month').add(1, 'month')

        const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, {
            ...getContextRequest(batch),
            enabled: true,
        })

        // create recurrent payments
        await createRecurrentPaymentForRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(1)

        const [recurrentPayment] = recurrentPayments
        expect(recurrentPayment).toHaveProperty('status')
        expect(recurrentPayment).toHaveProperty('tryCount')
        expect(recurrentPayment).toHaveProperty('state')
        expect(recurrentPayment).toHaveProperty('billingReceipts')
        expect(recurrentPayment).toHaveProperty('recurrentPaymentContext')

        expect(recurrentPayment.status).toEqual(RECURRENT_PAYMENT_INIT_STATUS)
        expect(recurrentPayment.payAfter).toBeNull()
        expect(recurrentPayment.tryCount).toEqual(0)
        expect(recurrentPayment.state).toBeDefined()
        expect(recurrentPayment.billingReceipts).toHaveLength(2)

        const ids = recurrentPayment.billingReceipts.map(receipt => receipt.id)
        expect(ids).toContain(billingReceipts[0].id)
        expect(ids).toContain(billingReceipts[1].id)

    })

    it('should not create RecurrentPayment - no receipts for date', async () => {
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

        // create recurrent payments
        await createRecurrentPaymentForRecurrentPaymentContext(adminContext, today, recurrentPaymentContext)

        const recurrentPayments = await RecurrentPayment.getAll(admin, {
            recurrentPaymentContext: { id: recurrentPaymentContext.id },
        })

        expect(recurrentPayments).toHaveLength(0)
    })
})