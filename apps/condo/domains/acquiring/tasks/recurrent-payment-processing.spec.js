/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const faker = require('faker')

const {
    setFakeClientMode,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    RECURRENT_PAYMENT_INIT_STATUS,
    RECURRENT_PAYMENT_DONE_STATUS,
    RECURRENT_PAYMENT_ERROR_STATUS,
    RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS,
    RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    makePayerWithMultipleConsumers,
    createTestRecurrentPaymentContext,
    RecurrentPayment,
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    createTestRecurrentPayment,
} = require('@condo/domains/acquiring/utils/testSchema')

const {
    chargeByRecurrentPaymentAndPaymentAdapter,
} = require('./recurrent-payment-processing')

const { keystone } = index

describe('recurrent-payment-processing', () => {
    let adminContext
    setFakeClientMode(index)

    beforeAll(async () => {
        adminContext = await keystone.createContext({ skipAccessControl: true })
    })

    describe('processRecurrentPayment', () => {
        let admin,
            getContextRequest,
            getPaymentRequest,
            serviceConsumerBatch,
            recurrentPaymentContext

        beforeEach( async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            serviceConsumerBatch = batches[0]
            recurrentPaymentContext = (await createTestRecurrentPaymentContext(admin, getContextRequest(serviceConsumerBatch)))[0]
        })

        beforeAll(async () => {
            admin = await makeLoggedInAdminClient()

            getContextRequest = (batch) => ({
                enabled: true,
                limit: '100000000',
                autoPayReceipts: false,
                paymentDay: 10,
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

        it('should pay for recurrentPayment', async () => {
            // mock payment adapter
            const adapter = {
                checkCardToken: async () => true,
                proceedPayment: async () => ({ paid: true }),
            }

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // proceed
            await chargeByRecurrentPaymentAndPaymentAdapter(adminContext, recurrentPayment, adapter)

            // retrieve updated recurrent payment
            const result = await RecurrentPayment.getOne(admin, { id: recurrentPayment.id })

            expect(result).toBeDefined()
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('tryCount')

            expect(result.status).toEqual(RECURRENT_PAYMENT_DONE_STATUS)
            expect(result.tryCount).toEqual(recurrentPayment.tryCount + 1)

            // todo assert notifications are sent
        })

        it('shouldn\'t pay - card not valid', async () => {
            // mock payment adapter
            const { settings: { cardId } } = recurrentPaymentContext
            const adapter = {
                checkCardToken: async () => false,
                proceedPayment: async () => ({ paid: true }),
            }

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // proceed
            await chargeByRecurrentPaymentAndPaymentAdapter(adminContext, recurrentPayment, adapter)

            // retrieve updated recurrent payment
            const result = await RecurrentPayment.getOne(admin, { id: recurrentPayment.id })

            expect(result).toBeDefined()
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('tryCount')

            expect(result.status).toEqual(RECURRENT_PAYMENT_ERROR_STATUS)
            expect(result.tryCount).toEqual(recurrentPayment.tryCount + 1)
            expect(result.state).toMatchObject({
                errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
                errorMessage: `Provided card token id is not valid ${cardId}`,
            })
        })

        it('shouldn\'t pay - failed to pay', async () => {
            const errorCode = RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE
            const errorMessage = 'An error message'

            // mock payment adapter
            const adapter = {
                checkCardToken: async () => true,
                proceedPayment: async () => ({
                    paid: false,
                    errorCode,
                    errorMessage,
                }),
            }

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // proceed
            await chargeByRecurrentPaymentAndPaymentAdapter(adminContext, recurrentPayment, adapter)

            // retrieve updated recurrent payment
            const result = await RecurrentPayment.getOne(admin, { id: recurrentPayment.id })

            expect(result).toBeDefined()
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('tryCount')

            expect(result.status).toEqual(RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS)
            expect(result.tryCount).toEqual(recurrentPayment.tryCount + 1)
            expect(result.state).toMatchObject({
                errorCode,
                errorMessage,
            })
        })
    })
})