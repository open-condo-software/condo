/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const dayjs = require('dayjs')
const faker = require('faker')
const { v4: uuid } = require('uuid')

const {
    setFakeClientMode,
    catchErrorFrom,
    makeLoggedInAdminClient,
} = require('@open-condo/keystone/test.utils')

const {
    PAYMENT_DONE_STATUS,
    PAYMENT_WITHDRAWN_STATUS,
    PAYMENT_PROCESSING_STATUS,
} = require('@condo/domains/acquiring/constants/payment')
const {
    RECURRENT_PAYMENT_INIT_STATUS,
    RECURRENT_PAYMENT_PROCESSING_STATUS,
    RECURRENT_PAYMENT_DONE_STATUS,
    RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS,
    RECURRENT_PAYMENT_ERROR_STATUS,
    RECURRENT_PAYMENT_CANCEL_STATUS,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    Payment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const {
    makePayerWithMultipleConsumers,
    createTestRecurrentPaymentContext,
    registerMultiPaymentByTestClient,
    RecurrentPayment,
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    createTestRecurrentPayment,
    updateTestRecurrentPaymentContext,
} = require('@condo/domains/acquiring/utils/testSchema')
const { createTestBillingCategory } = require('@condo/domains/billing/utils/testSchema')
const {
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_FAILURE_RESULT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_SUCCESS_RESULT_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const {
    Message,
} = require('@condo/domains/notification/utils/serverSchema')
const {
    ServiceConsumer,
} = require('@condo/domains/resident/utils/serverSchema')
const { makeClientWithServiceConsumer } = require('@condo/domains/resident/utils/testSchema')

const {
    PAYMENT_ERROR_UNKNOWN_CODE,
    PAYMENT_ERROR_LIMIT_EXCEEDED_CODE,
    PAYMENT_ERROR_CONTEXT_NOT_FOUND_CODE,
    PAYMENT_ERROR_CONTEXT_DISABLED_CODE,
    PAYMENT_ERROR_CARD_TOKEN_NOT_VALID_CODE,
    PAYMENT_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE,
    PAYMENT_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
} = require('./constants')
const {
    getAllReadyToPayRecurrentPaymentContexts,
    getServiceConsumer,
    getReceiptsForServiceConsumer,
    filterPaidBillingReceipts,
    getReadyForProcessingPaymentsPage,
    registerMultiPayment,
    setRecurrentPaymentAsSuccess,
    setRecurrentPaymentAsFailed,
    sendTomorrowPaymentNotificationSafely,
} = require('./queries')

const pageSize = 10
const { keystone } = index
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'test-fingerprint-alphanumeric-value' } }

describe('recurrent payments queries', () => {
    let adminContext
    setFakeClientMode(index)

    beforeAll(async () => {
        adminContext = await keystone.createContext({ skipAccessControl: true })
    })

    describe('getAllReadyToPayRecurrentPaymentContexts', () => {
        let admin, getContextRequest, date

        beforeAll(async () => {
            admin = await makeLoggedInAdminClient()
            date = dayjs()

            getContextRequest = (batch) => ({
                enabled: false,
                limit: '10000',
                autoPayReceipts: false,
                paymentDay: date.date(),
                settings: { cardId: faker.datatype.uuid() },
                serviceConsumer: { connect: { id: batch.serviceConsumer.id } },
                billingCategory: { connect: { id: batch.billingReceipts[0].category.id } },
            })
        })

        it('should return with enabled=true only', async () => {
            const { batches } = await makePayerWithMultipleConsumers(3, 1)

            // create 3 contexts:
            // deleted, disabled and regular one
            const [{ id: id1 }] = await createTestRecurrentPaymentContext(admin, getContextRequest(batches[0]))
            await updateTestRecurrentPaymentContext(admin, id1, {
                deletedAt: dayjs().toISOString(),
            })
            const [{ id: id2 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: false,
            })
            const [{ id: id3 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[2]),
                enabled: true,
            })

            const objs = await getAllReadyToPayRecurrentPaymentContexts(adminContext, date, pageSize, 0, {
                id_in: [id1, id2, id3],
            })
            expect(objs).toHaveLength(1)
            expect(objs).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    enabled: true,
                    paymentDay: date.date(),
                }),
            ]))
        })

        it('should return with autoPayReceipts=false only', async () => {
            const { batches } = await makePayerWithMultipleConsumers(2, 1)
            const [{ id: id1 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                enabled: true,
            })
            const [{ id: id2 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: true,
                autoPayReceipts: true,
                paymentDay: null,
            })

            const objs = await getAllReadyToPayRecurrentPaymentContexts(adminContext, date, pageSize, 0, {
                id_in: [id1, id2],
            })
            expect(objs).toHaveLength(1)
            expect(objs).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    autoPayReceipts: false,
                    paymentDay: date.date(),
                }),
            ]))
        })

        it('should return with expected paymentDay only', async () => {
            const { batches } = await makePayerWithMultipleConsumers(3, 1)

            const [{ id: id1 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                enabled: true,
                paymentDay: date.date() + 1,
            })

            const [{ id: id2 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: true,
                paymentDay: date.date() - 1,
            })
            const [{ id: id3 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[2]),
                paymentDay: date.date(),
                enabled: true,
            })

            const objs = await getAllReadyToPayRecurrentPaymentContexts(adminContext, date, pageSize, 0, {
                id_in: [id1, id2, id3],
            })
            expect(objs).toHaveLength(1)
            expect(objs).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    enabled: true,
                    paymentDay: date.date(),
                }),
            ]))
        })

        it('should return with paymentDay is greater (for last day of month)', async () => {
            const admin = await makeLoggedInAdminClient()
            const { batches } = await makePayerWithMultipleConsumers(4, 1)
            const [{ id: id1 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                enabled: true,
                paymentDay: 28,
            })
            const [{ id: id2 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: true,
                paymentDay: 29,
            })
            const [{ id: id3 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[2]),
                enabled: true,
                paymentDay: 30,
            })
            const [{ id: id4 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[3]),
                enabled: true,
                paymentDay: 31,
            })

            const date = dayjs('2023-02-28')
            const objs = await getAllReadyToPayRecurrentPaymentContexts(adminContext, date, pageSize, 0, {
                id_in: [id1, id2, id3, id4],
            })
            expect(objs).toHaveLength(4)
            objs.forEach(obj => {
                expect(obj.paymentDay).toBeGreaterThanOrEqual(28)
            })
        })

        it('should return with extraArgs', async () => {
            const admin = await makeLoggedInAdminClient()
            const { batches } = await makePayerWithMultipleConsumers(2, 1)
            const [{ id: id1 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                enabled: true,
            })
            const [{ id: id2 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: true,
                autoPayReceipts: true,
                paymentDay: null,
            })

            const objs = await getAllReadyToPayRecurrentPaymentContexts(adminContext, date, pageSize, 0, {
                id_in: [id1, id2],
                paymentDay: null,
                autoPayReceipts: true,
            })
            expect(objs).toHaveLength(1)
            expect(objs).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    autoPayReceipts: true,
                }),
            ]))
        })
    })

    describe('getServiceConsumer', () => {
        let serviceConsumerBatch

        beforeAll(async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            serviceConsumerBatch = batches
        })

        it('should return serviceConsumer', async () => {
            const serviceConsumerId = serviceConsumerBatch[0].serviceConsumer.id
            const serviceConsumer = await getServiceConsumer(adminContext, serviceConsumerId)

            expect(serviceConsumer).toHaveProperty('id')
            expect(serviceConsumer).toHaveProperty('accountNumber')
            expect(serviceConsumer).toHaveProperty('billingIntegrationContext')
            expect(serviceConsumer).toHaveProperty('resident.user.id')
            expect(serviceConsumer.billingIntegrationContext).toHaveProperty('id')
        })

        it('should throw error for wrong id', async () => {
            await catchErrorFrom(async () => {
                await getServiceConsumer(adminContext, uuid())
            }, (error) => {
                expect(error.message).toContain('ServiceConsumer not found for id')
            })
        })

        it('should throw error for deleted consumer', async () => {
            const anotherServiceConsumerClient = await makeClientWithServiceConsumer()
            const serviceConsumerId = anotherServiceConsumerClient.serviceConsumer.id
            await ServiceConsumer.softDelete(adminContext, serviceConsumerId, dvAndSender)

            await catchErrorFrom(async () => {
                await getServiceConsumer(adminContext, serviceConsumerId)
            }, (error) => {
                expect(error.message).toContain('Found deleted serviceConsumer for id ')
            })
        })
    })

    describe('getReceiptsForServiceConsumer', () => {

        it('should return receipts for category', async () => {
            const { batches } = await makePayerWithMultipleConsumers(2, 1)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts: [{
                    id,
                    category,
                    period,
                }],
            } = batch
            const today = dayjs(period).date(15)

            const receipts = await getReceiptsForServiceConsumer(adminContext, today, serviceConsumer, category)
            expect(category).toBeDefined()
            expect(category.id).toBeDefined()
            expect(serviceConsumer).toBeDefined()
            expect(serviceConsumer.id).toBeDefined()
            expect(receipts).toHaveLength(1)
            expect(receipts[0].id).toEqual(id)
        })

        it('should return receipts without category', async () => {
            const { batches } = await makePayerWithMultipleConsumers(2, 1)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts: [{
                    id,
                    period,
                }],
            } = batch
            const today = dayjs(period).date(15)

            const receipts = await getReceiptsForServiceConsumer(adminContext, today, serviceConsumer)
            expect(serviceConsumer).toBeDefined()
            expect(serviceConsumer.id).toBeDefined()
            expect(receipts).toHaveLength(1)
            expect(receipts[0].id).toEqual(id)
        })

        it('should not return receipts if for wrong period', async () => {
            const { batches } = await makePayerWithMultipleConsumers(2, 1)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts: [{
                    period,
                }],
            } = batch
            const today = dayjs(period).add(45, 'day')

            const receipts = await getReceiptsForServiceConsumer(adminContext, today, serviceConsumer)
            expect(receipts).toHaveLength(0)
        })

        it('should validate that accountNumber for service consumer not empty', async () => {
            const { batches } = await makePayerWithMultipleConsumers(2, 1)
            const [batch] = batches
            const {
                serviceConsumer,
            } = batch

            await ServiceConsumer.update(adminContext, serviceConsumer.id, {
                ...dvAndSender,
                accountNumber: '',
            })

            await catchErrorFrom(async () => {
                await getReceiptsForServiceConsumer(adminContext, dayjs(), serviceConsumer)
            }, (error) => {
                expect(error.message).toContain(`Can not retrieve billing receipts for service consumer ${serviceConsumer.id} since billingAccountNumber is empty`)
            })
        })

        it('should validate that billingIntegrationContext for service consumer not empty', async () => {
            const { serviceConsumer } = await makeClientWithServiceConsumer()

            await catchErrorFrom(async () => {
                await getReceiptsForServiceConsumer(adminContext, dayjs(), serviceConsumer)
            }, (error) => {
                expect(error.message).toContain(`Can not retrieve billing receipts for service consumer ${serviceConsumer.id} since billingIntegrationContextId is empty`)
            })
        })
    })

    describe('filterPaidBillingReceipts', () => {
        it('should return all receipts - no payments', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 2)
            const [batch] = batches
            const {
                billingReceipts,
            } = batch

            // get receipts
            const receipts = await filterPaidBillingReceipts(adminContext, billingReceipts)

            expect(receipts).toHaveLength(billingReceipts.length)
        })

        it('should return all receipts - payments with not certain status', async () => {
            const { commonData, batches } = await makePayerWithMultipleConsumers(1, 2)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts,
            } = batch

            // register multi payment
            const [result] = await registerMultiPaymentByTestClient(commonData.client, [{
                serviceConsumer: { id: serviceConsumer.id },
                receipts: billingReceipts.map(receipt => ({ id: receipt.id })),
            }])
            expect(result).toBeDefined()
            expect(result).toHaveProperty('dv', 1)
            expect(result).toHaveProperty('multiPaymentId')

            // get receipts
            const receipts = await filterPaidBillingReceipts(adminContext, billingReceipts)

            expect(receipts).toHaveLength(billingReceipts.length)
        })

        it('should return one receipt - a payment with done status', async () => {
            const { commonData, batches } = await makePayerWithMultipleConsumers(1, 2)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts,
            } = batch

            // register multi payment
            const [result] = await registerMultiPaymentByTestClient(commonData.client, [{
                serviceConsumer: { id: serviceConsumer.id },
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

            // get receipts
            const receipts = await filterPaidBillingReceipts(adminContext, billingReceipts)
            expect(receipts).toHaveLength(1)
            expect(receipts[0].id).toEqual(payments[1].receipt.id)
        })

        it('should return one receipt - a payment with withdraw status', async () => {
            const { commonData, batches } = await makePayerWithMultipleConsumers(1, 2)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts,
            } = batch

            // register multi payment
            const [result] = await registerMultiPaymentByTestClient(commonData.client, [{
                serviceConsumer: { id: serviceConsumer.id },
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
                status: PAYMENT_PROCESSING_STATUS,
                advancedAt: dayjs().toISOString(),
            })
            await Payment.update(adminContext, payments[0].id, {
                ...dvAndSender,
                status: PAYMENT_WITHDRAWN_STATUS,
                advancedAt: dayjs().toISOString(),
            })

            // get receipts
            const receipts = await filterPaidBillingReceipts(adminContext, billingReceipts)
            expect(receipts).toHaveLength(1)
            expect(receipts[0].id).toEqual(payments[1].receipt.id)
        })

        it('should return one receipt - processing, done and withdraw statuses', async () => {
            const { commonData, batches } = await makePayerWithMultipleConsumers(1, 3)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts,
            } = batch

            // register multi payment
            const [result] = await registerMultiPaymentByTestClient(commonData.client, [{
                serviceConsumer: { id: serviceConsumer.id },
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

            // mark payment as processing
            for (const payment of payments) {
                await Payment.update(adminContext, payment.id, {
                    ...dvAndSender,
                    status: PAYMENT_PROCESSING_STATUS,
                    advancedAt: dayjs().toISOString(),
                })
            }

            // mark as done and withdraw
            await Payment.update(adminContext, payments[0].id, {
                ...dvAndSender,
                status: PAYMENT_DONE_STATUS,
                advancedAt: dayjs().toISOString(),
            })
            await Payment.update(adminContext, payments[1].id, {
                ...dvAndSender,
                status: PAYMENT_WITHDRAWN_STATUS,
                advancedAt: dayjs().toISOString(),
            })

            // get receipts
            const receipts = await filterPaidBillingReceipts(adminContext, billingReceipts)
            expect(receipts).toHaveLength(1)
            expect(receipts[0].id).toEqual(payments[2].receipt.id)
        })

        it('should return no receipt - all payments done status', async () => {
            const { commonData, batches } = await makePayerWithMultipleConsumers(1, 2)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts,
            } = batch

            // register multi payment
            const [result] = await registerMultiPaymentByTestClient(commonData.client, [{
                serviceConsumer: { id: serviceConsumer.id },
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

            // mark payment as done
            for (const payment of payments) {
                await Payment.update(adminContext, payment.id, {
                    ...dvAndSender,
                    status: PAYMENT_DONE_STATUS,
                    advancedAt: dayjs().toISOString(),
                })
            }

            // get receipts
            const receipts = await filterPaidBillingReceipts(adminContext, billingReceipts)

            expect(receipts).toHaveLength(0)
        })
    })

    describe('getReadyForProcessingPaymentsPage', () => {
        let admin,
            getContextRequest,
            getPaymentRequest,
            billingCategory,
            serviceConsumerClient,
            recurrentPaymentContext

        beforeEach( async () => {
            serviceConsumerClient = await makeClientWithServiceConsumer()
            recurrentPaymentContext = (await createTestRecurrentPaymentContext(admin, getContextRequest()))[0]
        })

        beforeAll(async () => {
            admin = await makeLoggedInAdminClient()
            billingCategory = (await createTestBillingCategory(admin, { name: `Category ${new Date()}` }))[0]

            getContextRequest = () => ({
                enabled: false,
                limit: '10000',
                autoPayReceipts: false,
                paymentDay: 10,
                settings: { cardId: faker.datatype.uuid() },
                serviceConsumer: { connect: { id: serviceConsumerClient.serviceConsumer.id } },
                billingCategory: { connect: { id: billingCategory.id } },
            })

            getPaymentRequest = ({ payAfter = null,  tryCount = 0, status = RECURRENT_PAYMENT_INIT_STATUS }) => ({
                payAfter,
                tryCount,
                status,
                state: {},
                billingReceipts: [ { id: faker.datatype.uuid() }],
                recurrentPaymentContext: { connect: { id: recurrentPaymentContext.id } },
            })
        })

        it('should return payment with empty payAfter', async () => {
            const payAfter = null
            const tryCount = 0

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount }),
            )

            const recurrentPayments = await getReadyForProcessingPaymentsPage(adminContext, pageSize, 0, {
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            })

            expect(recurrentPayments).toBeDefined()
            expect(recurrentPayments).toHaveLength(1)
            expect(recurrentPayments[0]).toHaveProperty('id')
            expect(recurrentPayments[0].id).toEqual(recurrentPayment.id)
        })

        it('should return payment with payAfter set to today', async () => {
            const payAfter = dayjs().startOf('day').toISOString()
            const tryCount = 0

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount }),
            )

            const recurrentPayments = await getReadyForProcessingPaymentsPage(adminContext, pageSize, 0, {
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            })

            expect(recurrentPayments).toBeDefined()
            expect(recurrentPayments).toHaveLength(1)
            expect(recurrentPayments[0]).toHaveProperty('id')
            expect(recurrentPayments[0].id).toEqual(recurrentPayment.id)
        })

        it('should return payment with payAfter set to past', async () => {
            const payAfter = dayjs().subtract(2, 'days').toISOString()
            const tryCount = 0

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount }),
            )

            const recurrentPayments = await getReadyForProcessingPaymentsPage(adminContext, pageSize, 0, {
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            })

            expect(recurrentPayments).toBeDefined()
            expect(recurrentPayments).toHaveLength(1)
            expect(recurrentPayments[0]).toHaveProperty('id')
            expect(recurrentPayments[0].id).toEqual(recurrentPayment.id)
        })

        it('should filter payment with payAfter set to tomorrow', async () => {
            const payAfter = dayjs().add(1, 'day').toISOString()
            const tryCount = 0

            // create test recurrent payments
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter: null, tryCount }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount }),
            )

            const recurrentPayments = await getReadyForProcessingPaymentsPage(adminContext, pageSize, 0, {
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            })

            expect(recurrentPayments).toBeDefined()
            expect(recurrentPayments).toHaveLength(1)
            expect(recurrentPayments[0]).toHaveProperty('id')
            expect(recurrentPayments[0].id).toEqual(recurrentPayment.id)
        })

        it('should filter payment with tryCount >= 5', async () => {
            const payAfter = null
            const tryCount = 5

            // create test recurrent payments
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount: 0 }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount }),
            )

            const recurrentPayments = await getReadyForProcessingPaymentsPage(adminContext, pageSize, 0, {
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            })

            expect(recurrentPayments).toBeDefined()
            expect(recurrentPayments).toHaveLength(1)
            expect(recurrentPayments[0]).toHaveProperty('id')
            expect(recurrentPayments[0].id).toEqual(recurrentPayment.id)
        })

        it('should return payment only with RECURRENT_PAYMENT_INIT_STATUS status', async () => {
            const payAfter = null
            const tryCount = 0

            // create test recurrent payments
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_INIT_STATUS }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_PROCESSING_STATUS }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_DONE_STATUS }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_ERROR_STATUS }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_CANCEL_STATUS }),
            )

            const recurrentPayments = await getReadyForProcessingPaymentsPage(adminContext, pageSize, 0, {
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            })

            expect(recurrentPayments).toBeDefined()
            expect(recurrentPayments).toHaveLength(1)
            expect(recurrentPayments[0]).toHaveProperty('id')
            expect(recurrentPayments[0].id).toEqual(recurrentPayment.id)
        })


        it('should return payment only with RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS status', async () => {
            const payAfter = null
            const tryCount = 0

            // create test recurrent payments
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_PROCESSING_STATUS }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_DONE_STATUS }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_ERROR_STATUS }),
            )
            await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount, status:  RECURRENT_PAYMENT_CANCEL_STATUS }),
            )

            const recurrentPayments = await getReadyForProcessingPaymentsPage(adminContext, pageSize, 0, {
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            })

            expect(recurrentPayments).toBeDefined()
            expect(recurrentPayments).toHaveLength(1)
            expect(recurrentPayments[0]).toHaveProperty('id')
            expect(recurrentPayments[0].id).toEqual(recurrentPayment.id)
        })
    })

    describe('registerMultiPayment', () => {
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

        it('should return multi payment with registered=true', async () => {
            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // register multi payment
            const response = await registerMultiPayment(adminContext, recurrentPayment)

            expect(response).toBeDefined()
            expect(response).toHaveProperty('registered')
            expect(response.registered).toBeTruthy()
            expect(response).not.toHaveProperty('errorCode')
            expect(response).not.toHaveProperty('errorMessage')
            expect(response).toHaveProperty('multiPaymentId')
            expect(response).toHaveProperty('directPaymentUrl')
            expect(response).toHaveProperty('getCardTokensUrl')
        })

        it('should return multi payment with registered=true and no limit set', async () => {
            // create test recurrent payment context
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const recurrentPaymentContext = (await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                limit: null,
            }))[0]

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(batches[0], recurrentPaymentContext),
            )

            // register multi payment
            const response = await registerMultiPayment(adminContext, recurrentPayment)

            expect(response).toBeDefined()
            expect(response).toHaveProperty('registered')
            expect(response.registered).toBeTruthy()
            expect(response).not.toHaveProperty('errorCode')
            expect(response).not.toHaveProperty('errorMessage')
            expect(response).toHaveProperty('multiPaymentId')
            expect(response).toHaveProperty('directPaymentUrl')
            expect(response).toHaveProperty('getCardTokensUrl')
        })

        it('should return registered=false - bills already paid', async () => {
            const {
                serviceConsumer,
                billingReceipts,
            } = serviceConsumerBatch

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // register multi payment
            const [result] = await registerMultiPaymentByTestClient(admin, [{
                serviceConsumer: { id: serviceConsumer.id },
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

            // mark payment as done
            for (const payment of payments) {
                await Payment.update(adminContext, payment.id, {
                    ...dvAndSender,
                    status: PAYMENT_DONE_STATUS,
                    advancedAt: dayjs().toISOString(),
                })
            }

            // register multi payment through mutation under test
            const response = await registerMultiPayment(adminContext, recurrentPayment)

            expect(response).toBeDefined()
            expect(response).toHaveProperty('registered')
            expect(response.registered).not.toBeTruthy()
            expect(response).not.toHaveProperty('errorCode')
            expect(response).not.toHaveProperty('errorMessage')
        })

        it('should return registered=false - no bills to pay', async () => {
            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest({
                    ...serviceConsumerBatch,
                    billingReceipts: [],
                }, recurrentPaymentContext),
            )

            // register multi payment
            const response = await registerMultiPayment(adminContext, recurrentPayment)

            expect(response).toBeDefined()
            expect(response).toHaveProperty('registered')
            expect(response.registered).not.toBeTruthy()
            expect(response).not.toHaveProperty('errorCode')
            expect(response).not.toHaveProperty('errorMessage')
        })

        it('should return registered=false and PAYMENT_ERROR_LIMIT_EXCEEDED_CODE error', async () => {
            // create test recurrent payment context
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const recurrentPaymentContext = (await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                limit: '0.001',
            }))[0]

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(batches[0], recurrentPaymentContext),
            )

            // register multi payment
            const response = await registerMultiPayment(adminContext, recurrentPayment)

            expect(response).toBeDefined()
            expect(response).toHaveProperty('registered')
            expect(response).toHaveProperty('errorCode')
            expect(response).toHaveProperty('errorMessage')

            expect(response.registered).not.toBeTruthy()
            expect(response.errorCode).toEqual(PAYMENT_ERROR_LIMIT_EXCEEDED_CODE)
            expect(response.errorMessage).toContain('RecurrentPaymentContext limit exceeded for multi payment')
        })

        it('should return registered=false and PAYMENT_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE error', async () => {
            // create service consumer without set up acquiring integration context
            const serviceConsumerClient = await makeClientWithServiceConsumer()

            // create test recurrent payment context
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const recurrentPaymentContext = (await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest({
                    ...batches[0],
                    serviceConsumer: serviceConsumerClient.serviceConsumer,
                }),
            }))[0]

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // register multi payment
            const response = await registerMultiPayment(adminContext, recurrentPayment)

            expect(response).toBeDefined()
            expect(response).toHaveProperty('registered')
            expect(response).toHaveProperty('errorCode')
            expect(response).toHaveProperty('errorMessage')

            expect(response.registered).not.toBeTruthy()
            expect(response.errorCode).toEqual(PAYMENT_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE)
            expect(response.errorMessage).toContain('Can not register multi payment: ')
        })

        it('should return registered=false and PAYMENT_ERROR_CONTEXT_DISABLED_CODE error', async () => {
            // create test recurrent payment context
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const recurrentPaymentContext = (await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                enabled: false,
            }))[0]

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(batches[0], recurrentPaymentContext),
            )

            // register multi payment
            const response = await registerMultiPayment(adminContext, recurrentPayment)

            expect(response).toBeDefined()
            expect(response).toHaveProperty('registered')
            expect(response).toHaveProperty('errorCode')
            expect(response).toHaveProperty('errorMessage')

            expect(response.registered).not.toBeTruthy()
            expect(response.errorCode).toEqual(PAYMENT_ERROR_CONTEXT_DISABLED_CODE)
            expect(response.errorMessage)
                .toContain(`RecurrentPaymentContext (${recurrentPaymentContext.id}) is disabled`)
        })

        it('should return registered=false and PAYMENT_ERROR_CONTEXT_NOT_FOUND_CODE error', async () => {
            // create test recurrent payment context
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const recurrentPaymentContext = (await createTestRecurrentPaymentContext(admin, getContextRequest(batches[0])))[0]

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(batches[0], recurrentPaymentContext),
            )

            // delete context
            await updateTestRecurrentPaymentContext(admin, recurrentPaymentContext.id, {
                deletedAt: dayjs().toISOString(),
            })

            // register multi payment
            const response = await registerMultiPayment(adminContext, recurrentPayment)

            expect(response).toBeDefined()
            expect(response).toHaveProperty('registered')
            expect(response).toHaveProperty('errorCode')
            expect(response).toHaveProperty('errorMessage')

            expect(response.registered).not.toBeTruthy()
            expect(response.errorCode).toEqual(PAYMENT_ERROR_CONTEXT_NOT_FOUND_CODE)
            expect(response.errorMessage)
                .toContain(`RecurrentPaymentContext not found for RecurrentPayment(${recurrentPayment.id})`)
        })
    })

    describe('setRecurrentPaymentAsSuccess', () => {
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

        it('should set status and increase try count', async () => {
            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // set status
            await setRecurrentPaymentAsSuccess(adminContext, recurrentPayment)

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
            })
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('recurrentPaymentContext')
            expect(notification.meta.recurrentPaymentContext).toHaveProperty('id')
            expect(notification.meta.recurrentPaymentContext.id).toEqual(recurrentPaymentContext.id)
        })
    })

    describe('setRecurrentPaymentAsFailed', () => {
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

        it('should set retry status and increase try count for empty errorCode', async () => {
            const errorCode = PAYMENT_ERROR_UNKNOWN_CODE
            const errorMessage = 'An error message'

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // set status
            await setRecurrentPaymentAsFailed(adminContext, recurrentPayment, errorMessage)

            // retrieve updated recurrent payment
            const result = await RecurrentPayment.getOne(admin, { id: recurrentPayment.id })

            expect(result).toBeDefined()
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('tryCount')
            expect(result).toHaveProperty('state')

            expect(result.status).toEqual(RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS)
            expect(result.tryCount).toEqual(recurrentPayment.tryCount + 1)
            expect(result.state).toMatchObject({
                errorCode,
                errorMessage,
            })

            const notification = await Message.getOne(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_FAILURE_RESULT_MESSAGE_TYPE,
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            })
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('errorCode')
            expect(notification.meta.errorCode).toEqual(errorCode)
            expect(notification.meta).toHaveProperty('recurrentPaymentContext')
            expect(notification.meta.recurrentPaymentContext).toHaveProperty('id')
            expect(notification.meta.recurrentPaymentContext.id).toEqual(recurrentPaymentContext.id)
        })

        const retryCases = [
            [PAYMENT_ERROR_UNKNOWN_CODE],
            [PAYMENT_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE],
            [PAYMENT_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE],
        ]
        test.each(retryCases)('should set retry status and increase try count for %s errorCode', async (errorCode) => {
            const errorMessage = 'An error message'

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // set status
            await setRecurrentPaymentAsFailed(adminContext, recurrentPayment, errorMessage, errorCode)

            // retrieve updated recurrent payment
            const result = await RecurrentPayment.getOne(admin, { id: recurrentPayment.id })

            expect(result).toBeDefined()
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('tryCount')
            expect(result).toHaveProperty('state')

            expect(result.status).toEqual(RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS)
            expect(result.tryCount).toEqual(recurrentPayment.tryCount + 1)
            expect(result.state).toMatchObject({
                errorCode,
                errorMessage,
            })

            const notification = await Message.getOne(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_FAILURE_RESULT_MESSAGE_TYPE,
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            })
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('errorCode')
            expect(notification.meta.errorCode).toEqual(errorCode)
            expect(notification.meta).toHaveProperty('recurrentPaymentContext')
            expect(notification.meta.recurrentPaymentContext).toHaveProperty('id')
            expect(notification.meta.recurrentPaymentContext.id).toEqual(recurrentPaymentContext.id)
        })

        const noRetryCases = [
            [PAYMENT_ERROR_LIMIT_EXCEEDED_CODE],
            [PAYMENT_ERROR_CONTEXT_NOT_FOUND_CODE],
            [PAYMENT_ERROR_CONTEXT_DISABLED_CODE],
            [PAYMENT_ERROR_CARD_TOKEN_NOT_VALID_CODE],
        ]
        test.each(noRetryCases)('should set error status and increase try count for %s errorCode', async (errorCode) => {
            const errorMessage = 'An error message'

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )

            // set status
            await setRecurrentPaymentAsFailed(adminContext, recurrentPayment, errorMessage, errorCode)

            // retrieve updated recurrent payment
            const result = await RecurrentPayment.getOne(admin, { id: recurrentPayment.id })

            expect(result).toBeDefined()
            expect(result).toHaveProperty('status')
            expect(result).toHaveProperty('tryCount')
            expect(result).toHaveProperty('state')

            expect(result.status).toEqual(RECURRENT_PAYMENT_ERROR_STATUS)
            expect(result.tryCount).toEqual(recurrentPayment.tryCount + 1)
            expect(result.state).toMatchObject({
                errorCode,
                errorMessage,
            })

            const notification = await Message.getOne(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_FAILURE_RESULT_MESSAGE_TYPE,
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            })
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('errorCode')
            expect(notification.meta.errorCode).toEqual(errorCode)
            expect(notification.meta).toHaveProperty('recurrentPaymentContext')
            expect(notification.meta.recurrentPaymentContext).toHaveProperty('id')
            expect(notification.meta.recurrentPaymentContext.id).toEqual(recurrentPaymentContext.id)
        })
    })

    describe('sendTomorrowPaymentNotificationSafely', () => {
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

        it('should send notification', async () => {
            // send notification
            await sendTomorrowPaymentNotificationSafely(adminContext, recurrentPaymentContext)

            const [notification] = await Message.getAll(adminContext, {
                type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
                user: { id: serviceConsumerBatch.resident.user.id },
            }, {
                sortBy: 'createdAt_DESC',
            })
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('recurrentPaymentContext')
            expect(notification.meta.recurrentPaymentContext).toHaveProperty('id')
            expect(notification.meta.recurrentPaymentContext.id).toEqual(recurrentPaymentContext.id)
        })

        it('should send one notification for retry context processing', async () => {
            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext),
            )
            expect(recurrentPayment).toBeDefined()
            expect(recurrentPayment).toHaveProperty('id')

            // send notification
            await sendTomorrowPaymentNotificationSafely(adminContext, recurrentPaymentContext, recurrentPayment)
            await sendTomorrowPaymentNotificationSafely(adminContext, recurrentPaymentContext, recurrentPayment)

            const notifications = await Message.getAll(adminContext, {
                type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
                user: { id: serviceConsumerBatch.resident.user.id },
            }, {
                sortBy: 'createdAt_DESC',
            })
            expect(notifications).toHaveLength(1)
            const [notification] = notifications
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('recurrentPaymentContext')
            expect(notification.meta.recurrentPaymentContext).toHaveProperty('id')
            expect(notification.meta.recurrentPaymentContext.id).toEqual(recurrentPaymentContext.id)
        })

        it('should send one notification for retry payment processing', async () => {
            // send notification
            await sendTomorrowPaymentNotificationSafely(adminContext, recurrentPaymentContext)
            await sendTomorrowPaymentNotificationSafely(adminContext, recurrentPaymentContext)

            const notifications = await Message.getAll(adminContext, {
                type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
                user: { id: serviceConsumerBatch.resident.user.id },
            }, {
                sortBy: 'createdAt_DESC',
            })
            expect(notifications).toHaveLength(1)
            const [notification] = notifications
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('recurrentPaymentContext')
            expect(notification.meta.recurrentPaymentContext).toHaveProperty('id')
            expect(notification.meta.recurrentPaymentContext.id).toEqual(recurrentPaymentContext.id)
        })
    })
})