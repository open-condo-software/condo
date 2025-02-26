/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const Big = require('big.js')
const dayjs = require('dayjs')

jest.mock('@condo/domains/acquiring/tasks/utils/PaymentAdapter', () => {
    class MockPaymentAdapter {
        async checkCardToken () { return true }
        async proceedPayment () { return { paid: true } }
    }

    return {
        PaymentAdapter: MockPaymentAdapter,
    }
})

const conf = require('@open-condo/config')
const {
    setFakeClientMode,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const { MULTIPAYMENT_WITHDRAWN_STATUS, MULTIPAYMENT_PROCESSING_STATUS } = require('@condo/domains/acquiring/constants/payment')
const { PAYMENT_PROCESSING_STATUS, PAYMENT_WITHDRAWN_STATUS } = require('@condo/domains/acquiring/constants/payment')
const {
    RECURRENT_PAYMENT_INIT_STATUS,
    RECURRENT_PAYMENT_DONE_STATUS,
    RECURRENT_PAYMENT_ERROR_STATUS,
    RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS,
    RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const { chargeRecurrentPayments } = require('@condo/domains/acquiring/tasks/chargeRecurrentPayments')
const {
    makePayerWithMultipleConsumers,
    createTestRecurrentPaymentContext,
    RecurrentPayment, updateTestMultiPayment,
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    createTestRecurrentPayment,
} = require('@condo/domains/acquiring/utils/testSchema')
const { registerMultiPaymentByTestClient, updateTestPayment, getRandomHiddenCard, MultiPayment } = require('@condo/domains/acquiring/utils/testSchema')
const {
    RECURRENT_PAYMENT_PROCEEDING_SUCCESS_RESULT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_CARD_TOKEN_NOT_VALID_ERROR_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_ACQUIRING_PAYMENT_PROCEED_ERROR_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { MESSAGE_FIELDS } = require('@condo/domains/notification/gql')
const {
    Message,
} = require('@condo/domains/notification/utils/serverSchema')

const {
    chargeByRecurrentPaymentAndPaymentAdapter,
} = require('./chargeRecurrentPayments')

const { keystone } = index

describe('charge-recurrent-payments', () => {
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

        beforeEach(async () => {
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

            const notification = await Message.getOne(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_SUCCESS_RESULT_MESSAGE_TYPE,
                uniqKey: `rp_${recurrentPayment.id}_1_true`,
            }, MESSAGE_FIELDS)
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                recurrentPaymentId: recurrentPayment.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/`,
            })
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

            const notification = await Message.getOne(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_CARD_TOKEN_NOT_VALID_ERROR_MESSAGE_TYPE,
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            }, MESSAGE_FIELDS)
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')
            expect(notification.meta.data).toHaveProperty('errorCode')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                recurrentPaymentId: recurrentPayment.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                errorCode: RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
                url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}/`,
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

            const notification = await Message.getOne(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_ACQUIRING_PAYMENT_PROCEED_ERROR_MESSAGE_TYPE,
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            }, MESSAGE_FIELDS)
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')
            expect(notification.meta.data).toHaveProperty('errorCode')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                recurrentPaymentId: recurrentPayment.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                errorCode,
                url: `${conf.SERVER_URL}/payments/`,
            })
        })

        it('should pay for recurrent payment if receipt was not payed', async () => {
            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // partially pay for receipt
            const receipt = serviceConsumerBatch.billingReceipts[0]

            // proceed
            await chargeRecurrentPayments()

            // retrieve updated recurrent payment
            const result = await RecurrentPayment.getOne(admin, { id: recurrentPayment.id })
            expect(result).toBeDefined()
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('tryCount')

            const autoPayMultipayment = await MultiPayment.getOne(admin, { recurrentPaymentContext: { id: result.recurrentPaymentContext.id } })
            expect(autoPayMultipayment).toBeDefined()
            expect(Big(autoPayMultipayment.amountWithoutExplicitFee).toFixed(8)).toEqual(receipt.toPay)

            expect(result.status).toEqual(RECURRENT_PAYMENT_DONE_STATUS)
            expect(result.tryCount).toEqual(recurrentPayment.tryCount + 1)

            const notification = await Message.getOne(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_SUCCESS_RESULT_MESSAGE_TYPE,
                uniqKey: `rp_${recurrentPayment.id}_1_true`,
            }, MESSAGE_FIELDS)
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                recurrentPaymentId: recurrentPayment.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/`,
            })
        })

        it('should pay for recurrent payment if receipt was partially payed', async () => {
        // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // partially pay for receipt
            const receipt = serviceConsumerBatch.billingReceipts[0]
            const partialPayAmount = Big(receipt.toPay).mul(.5)
            const expectedAutoPayAmount = Big(receipt.toPay).minus(partialPayAmount)
            const [{ multiPaymentId }] = await registerMultiPaymentByTestClient(admin, [{
                receipts: [{ id: receipt.id }],
                serviceConsumer: { id: serviceConsumerBatch.serviceConsumer.id },
                amountDistribution: [{ receipt: { id: receipt.id }, amount: partialPayAmount.toString() }],
            }])
            const [multipayment] = await MultiPayment.getAll(admin, { id: multiPaymentId })

            await updateTestPayment(admin, multipayment.payments[0].id, {
                explicitFee: '0.0',
                status: PAYMENT_PROCESSING_STATUS,
            })
            await updateTestMultiPayment(admin, multipayment.id, {
                explicitFee: '0.0',
                explicitServiceCharge: '0.0',
                status: MULTIPAYMENT_PROCESSING_STATUS,
            })
            await updateTestPayment(admin, multipayment.payments[0].id, {
                advancedAt: dayjs().toISOString(),
                status: PAYMENT_WITHDRAWN_STATUS,
            })
            await updateTestMultiPayment(admin, multipayment.id, {
                withdrawnAt: dayjs().toISOString(),
                cardNumber: getRandomHiddenCard(),
                paymentWay: 'CARD',
                transactionId: faker.datatype.uuid(),
                status: MULTIPAYMENT_WITHDRAWN_STATUS,
            })

            // proceed
            await chargeRecurrentPayments()

            // retrieve updated recurrent payment
            const result = await RecurrentPayment.getOne(admin, { id: recurrentPayment.id })
            expect(result).toBeDefined()
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('tryCount')

            const autoPayMultipayment = await MultiPayment.getOne(admin, { recurrentPaymentContext: { id: result.recurrentPaymentContext.id } })
            expect(autoPayMultipayment).toBeDefined()
            expect(Big(autoPayMultipayment.amountWithoutExplicitFee).toFixed(8)).toEqual(expectedAutoPayAmount.toFixed(8))

            expect(result.status).toEqual(RECURRENT_PAYMENT_DONE_STATUS)
            expect(result.tryCount).toEqual(recurrentPayment.tryCount + 1)

            const notification = await Message.getOne(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_SUCCESS_RESULT_MESSAGE_TYPE,
                uniqKey: `rp_${recurrentPayment.id}_1_true`,
            }, MESSAGE_FIELDS)
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                recurrentPaymentId: recurrentPayment.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/`,
            })
        })

        it('should not pay for recurrent payment if receipt fully payed', async () => {
        // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // partially pay for receipt
            const receipt = serviceConsumerBatch.billingReceipts[0]
            const [{ multiPaymentId }] = await registerMultiPaymentByTestClient(admin, [{
                receipts: [{ id: receipt.id }],
                serviceConsumer: { id: serviceConsumerBatch.serviceConsumer.id },
            }])
            const [multipayment] = await MultiPayment.getAll(admin, { id: multiPaymentId })

            await updateTestPayment(admin, multipayment.payments[0].id, {
                explicitFee: '0.0',
                status: PAYMENT_PROCESSING_STATUS,
            })
            await updateTestMultiPayment(admin, multipayment.id, {
                explicitFee: '0.0',
                explicitServiceCharge: '0.0',
                status: MULTIPAYMENT_PROCESSING_STATUS,
            })
            await updateTestPayment(admin, multipayment.payments[0].id, {
                advancedAt: dayjs().toISOString(),
                status: PAYMENT_WITHDRAWN_STATUS,
            })
            await updateTestMultiPayment(admin, multipayment.id, {
                withdrawnAt: dayjs().toISOString(),
                cardNumber: getRandomHiddenCard(),
                paymentWay: 'CARD',
                transactionId: faker.datatype.uuid(),
                status: MULTIPAYMENT_WITHDRAWN_STATUS,
            })

            // proceed
            await chargeRecurrentPayments()

            // retrieve updated recurrent payment
            const result = await RecurrentPayment.getOne(admin, { id: recurrentPayment.id })
            expect(result).toBeDefined()
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('tryCount')

            expect(result.status).toEqual(RECURRENT_PAYMENT_ERROR_STATUS)
            expect(result.tryCount).toEqual(recurrentPayment.tryCount + 1)
            expect(result.state).toMatchObject({
                errorCode: 'NO_RECEIPTS_TO_PROCEED',
                errorMessage: 'No receipts to proceed',
            })

            const notification = await Message.getOne(adminContext, {
                type: 'RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE',
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            }, MESSAGE_FIELDS)
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')
            expect(notification.meta.data).toHaveProperty('errorCode')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                recurrentPaymentId: recurrentPayment.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                errorCode: 'NO_RECEIPTS_TO_PROCEED',
                url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}`,
            })
        })
    })
})