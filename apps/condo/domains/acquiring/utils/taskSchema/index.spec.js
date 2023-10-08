/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const Big = require('big.js')
const dayjs = require('dayjs')

const conf = require('@open-condo/config')
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
    RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_NOT_FOUND_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_DISABLED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_SERVICE_CONSUMER_NOT_FOUND_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_NO_RECEIPTS_TO_PROCEED_CODE,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    Payment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const {
    makePayerWithMultipleConsumers,
    createTestRecurrentPaymentContext,
    updateTestRecurrentPaymentContext,
    createTestRecurrentPayment,
    updateTestRecurrentPayment,
    registerMultiPaymentByTestClient,
    RecurrentPayment,
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    BillingReceipt,
} = require('@condo/domains/billing/utils/serverSchema')
const { createTestBillingCategory } = require('@condo/domains/billing/utils/testSchema')
const {
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_MESSAGE_TYPE,
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_NO_RECEIPTS_MESSAGE_TYPE,
    RECURRENT_PAYMENT_TOMORROW_PAYMENT_LIMIT_EXCEED_MESSAGE_TYPE,
    RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE_TYPE,
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
    getAllReadyToPayRecurrentPaymentContexts,
    getServiceConsumer,
    getReceiptsForServiceConsumer,
    filterPaidBillingReceipts,
    getReadyForProcessingPaymentsPage,
    registerMultiPayment,
    setRecurrentPaymentAsSuccess,
    setRecurrentPaymentAsFailed,
    sendTomorrowPaymentNotificationSafely,
    sendTomorrowPaymentNoReceiptsNotificationSafely,
    sendTomorrowPaymentLimitExceedNotificationSafely,
    sendNoReceiptsToProceedNotificationSafely,
    getNotificationMetaByErrorCode,
    isLimitExceedForBillingReceipts,
    RETRY_COUNT,
} = require('./index')

const offset = 0
const pageSize = 10
const { keystone } = index
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'test-fingerprint-alphanumeric-value' } }

describe('task schema queries', () => {
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
                paymentDay: date.add('1', 'day').date(),
            })

            const [{ id: id2 }] = await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: true,
                paymentDay: date.subtract('1', 'day').date(),
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
                autoPayReceipts: true,
            })
            expect(objs).toHaveLength(1)
            expect(objs).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    autoPayReceipts: true,
                }),
            ]))
        })

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await getAllReadyToPayRecurrentPaymentContexts(adminContext, null, pageSize, offset)
            }, (error) => {
                expect(error.message).toContain('invalid date argument')
            })

            await catchErrorFrom(async () => {
                await getAllReadyToPayRecurrentPaymentContexts(adminContext, date, null, offset)
            }, (error) => {
                expect(error.message).toContain('invalid pageSize argument')
            })

            await catchErrorFrom(async () => {
                await getAllReadyToPayRecurrentPaymentContexts(adminContext, date, -1, offset)
            }, (error) => {
                expect(error.message).toContain('invalid pageSize argument')
            })

            await catchErrorFrom(async () => {
                await getAllReadyToPayRecurrentPaymentContexts(adminContext, date, pageSize, null)
            }, (error) => {
                expect(error.message).toContain('invalid offset argument')
            })

            await catchErrorFrom(async () => {
                await getAllReadyToPayRecurrentPaymentContexts(adminContext, date, pageSize, -1)
            }, (error) => {
                expect(error.message).toContain('invalid offset argument')
            })
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
            expect(serviceConsumer).toHaveProperty('organization')
            expect(serviceConsumer).toHaveProperty('resident.user.id')
            expect(serviceConsumer.organization).toHaveProperty('id')
        })

        it('should throw error for wrong id', async () => {
            await catchErrorFrom(async () => {
                await getServiceConsumer(adminContext, faker.datatype.uuid())
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
                expect(error.message).toContain('ServiceConsumer not found for id')
            })
        })

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await getServiceConsumer(adminContext, null)
            }, (error) => {
                expect(error.message).toContain('invalid id argument')
            })
        })
    })

    describe('getReceiptsForServiceConsumer', () => {

        it('should return receipts for category', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
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
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
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

        it('should return receipts for previous period', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts: [{
                    period,
                }],
            } = batch
            const today = dayjs(period).startOf('month').add(1, 'month')

            const receipts = await getReceiptsForServiceConsumer(adminContext, today, serviceConsumer)
            expect(receipts).toHaveLength(1)
        })

        it('should return receipts for 2 month old receipts', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts: [{
                    period,
                }],
            } = batch
            const today = dayjs(period).startOf('month').add(2, 'month')

            const receipts = await getReceiptsForServiceConsumer(adminContext, today, serviceConsumer)
            expect(receipts).toHaveLength(1)
        })

        it('should not return receipts for 3 month old receipts', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            const [batch] = batches
            const {
                serviceConsumer,
                billingReceipts: [{
                    period,
                }],
            } = batch
            const today = dayjs(period).startOf('month').add(3, 'month')

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

        it('should work with empty billingIntegrationContext', async () => {
            const { serviceConsumer } = await makeClientWithServiceConsumer()

            const receipts = await getReceiptsForServiceConsumer(adminContext, dayjs(), serviceConsumer)

            expect(receipts).toHaveLength(0)
        })

        it('should return not deleted receipts', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 2)
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

            // delete the second billingReceipt
            await BillingReceipt.softDelete(adminContext, batch.billingReceipts[1].id, dvAndSender)

            // get receipts
            const receipts = await getReceiptsForServiceConsumer(adminContext, today, serviceConsumer, category)
            expect(receipts).toHaveLength(1)
            expect(receipts[0].id).toEqual(id)
        })

        it('should validate inputs', async () => {
            const { serviceConsumer } = await makeClientWithServiceConsumer()

            await catchErrorFrom(async () => {
                await getReceiptsForServiceConsumer(adminContext, null, serviceConsumer)
            }, (error) => {
                expect(error.message).toContain('invalid date argument')
            })

            await catchErrorFrom(async () => {
                await getReceiptsForServiceConsumer(adminContext, dayjs(), {})
            }, (error) => {
                expect(error.message).toContain('invalid serviceConsumer argument')
            })

            await catchErrorFrom(async () => {
                await getReceiptsForServiceConsumer(adminContext, dayjs(), null)
            }, (error) => {
                expect(error.message).toContain('invalid serviceConsumer argument')
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

        it('should return one receipt - deleted receipt case', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 2)
            const [batch] = batches
            const {
                billingReceipts,
            } = batch

            // delete the second billingReceipt
            await BillingReceipt.softDelete(adminContext, batch.billingReceipts[1].id, dvAndSender)

            // get receipts
            const receipts = await filterPaidBillingReceipts(adminContext, billingReceipts)
            expect(receipts).toHaveLength(1)
            expect(receipts[0].id).toEqual(billingReceipts[0].id)
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

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await filterPaidBillingReceipts(adminContext, null)
            }, (error) => {
                expect(error.message).toContain('invalid billingReceipts argument')
            })
        })
    })

    describe('isLimitExceedForBillingReceipts', () => {
        let admin,
            getContextRequest,
            billingCategory,
            serviceConsumerBatch,
            billingReceipts

        beforeEach( async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 1)
            serviceConsumerBatch = batches[0]
            billingReceipts = serviceConsumerBatch.billingReceipts
        })

        beforeAll(async () => {
            admin = await makeLoggedInAdminClient()
            billingCategory = (await createTestBillingCategory(admin, { name: `Category ${new Date()}` }))[0]

            getContextRequest = (batch, extra = {}) => ({
                enabled: false,
                limit: '10000',
                autoPayReceipts: false,
                paymentDay: 10,
                settings: { cardId: faker.datatype.uuid() },
                serviceConsumer: { connect: { id: batch.serviceConsumer.id } },
                billingCategory: { connect: { id: batch.billingReceipts[0].category.id } },
                ...extra,
            })
        })

        it('should return false for no limit case', async () => {
            // create context without limit
            const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, getContextRequest(
                serviceConsumerBatch,
                { limit: null },
            ))

            // get receipts
            const { isExceed, totalAmount } = await isLimitExceedForBillingReceipts(adminContext, recurrentPaymentContext, billingReceipts)

            expect(isExceed).toBeFalsy()
            expect(totalAmount).toBeUndefined()
        })

        it('should return false for not exceed limit case', async () => {
            // create context
            const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, getContextRequest(
                serviceConsumerBatch,
                { limit: '1000000000' },
            ))

            // get receipts
            const { isExceed, totalAmount } = await isLimitExceedForBillingReceipts(adminContext, recurrentPaymentContext, billingReceipts)

            expect(isExceed).toBeFalsy()
            expect(totalAmount).toBeDefined()
        })

        it('should return true for exceed limit case', async () => {
            // create context
            const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, getContextRequest(
                serviceConsumerBatch,
                { limit: '0.01' },
            ))

            // get receipts
            const { isExceed, totalAmount } = await isLimitExceedForBillingReceipts(adminContext, recurrentPaymentContext, billingReceipts)

            expect(isExceed).toBeTruthy()
            expect(totalAmount).toBeDefined()
        })

        it('should validate inputs', async () => {
            // create context
            const [recurrentPaymentContext] = await createTestRecurrentPaymentContext(admin, getContextRequest(serviceConsumerBatch))

            await catchErrorFrom(async () => {
                await isLimitExceedForBillingReceipts(adminContext, recurrentPaymentContext, null)
            }, (error) => {
                expect(error.message).toContain('invalid billingReceipts argument')
            })

            await catchErrorFrom(async () => {
                await isLimitExceedForBillingReceipts(adminContext, null, [])
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await isLimitExceedForBillingReceipts(adminContext, {}, [])
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await isLimitExceedForBillingReceipts(adminContext, { id: recurrentPaymentContext.id }, [])
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await isLimitExceedForBillingReceipts(adminContext, { id: recurrentPaymentContext.id, serviceConsumer: {} }, [])
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await isLimitExceedForBillingReceipts(adminContext, { id: recurrentPaymentContext.id, serviceConsumer: { id: null } }, [])
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })
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

        it('should filter deleted payment', async () => {
            const payAfter = null

            // create test recurrent payments
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                getPaymentRequest({ payAfter, tryCount: 0 }),
            )

            await updateTestRecurrentPayment(admin, recurrentPayment.id, {
                deletedAt: dayjs().toISOString(),
            })

            const recurrentPayments = await getReadyForProcessingPaymentsPage(adminContext, pageSize, 0, {
                recurrentPaymentContext: { id: recurrentPaymentContext.id },
            })

            expect(recurrentPayments).toHaveLength(0)
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

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await getReadyForProcessingPaymentsPage(adminContext, null, offset)
            }, (error) => {
                expect(error.message).toContain('invalid pageSize argument')
            })

            await catchErrorFrom(async () => {
                await getReadyForProcessingPaymentsPage(adminContext, -1, offset)
            }, (error) => {
                expect(error.message).toContain('invalid pageSize argument')
            })

            await catchErrorFrom(async () => {
                await getReadyForProcessingPaymentsPage(adminContext, pageSize, null)
            }, (error) => {
                expect(error.message).toContain('invalid offset argument')
            })

            await catchErrorFrom(async () => {
                await getReadyForProcessingPaymentsPage(adminContext, pageSize, -1)
            }, (error) => {
                expect(error.message).toContain('invalid offset argument')
            })
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

        it('should return registered=false and RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE error', async () => {
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
            expect(response.errorCode).toEqual(RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE)
            expect(response.errorMessage).toContain('RecurrentPaymentContext limit exceeded for multi payment')
        })

        it('should return registered=false and RECURRENT_PAYMENT_PROCESS_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE error', async () => {
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
            expect(response.errorCode).toEqual(RECURRENT_PAYMENT_PROCESS_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE)
            expect(response.errorMessage).toContain('Can not register multi payment: ')
        })

        it('should return registered=false and RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_DISABLED_CODE error', async () => {
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
            expect(response.errorCode).toEqual(RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_DISABLED_CODE)
            expect(response.errorMessage)
                .toContain(`RecurrentPaymentContext (${recurrentPaymentContext.id}) is disabled`)
        })

        it('should return registered=false and RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_NOT_FOUND_CODE error', async () => {
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
            expect(response.errorCode).toEqual(RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_NOT_FOUND_CODE)
            expect(response.errorMessage)
                .toContain(`RecurrentPaymentContext not found for RecurrentPayment(${recurrentPayment.id})`)
        })

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await registerMultiPayment(adminContext, null)
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await registerMultiPayment(adminContext, {})
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await registerMultiPayment(adminContext, {
                    id: faker.datatype.uuid(),
                })
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await registerMultiPayment(adminContext, {
                    id: faker.datatype.uuid(),
                    billingReceipts: [],
                })
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await registerMultiPayment(adminContext, {
                    id: faker.datatype.uuid(),
                    billingReceipts: [],
                    recurrentPaymentContext: {},
                })
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })
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

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await setRecurrentPaymentAsSuccess(adminContext, null)
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await setRecurrentPaymentAsSuccess(adminContext, {})
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await setRecurrentPaymentAsSuccess(adminContext, {
                    id: faker.datatype.uuid(),
                })
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })
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
            const errorCode = RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE
            const notificationMeta = getNotificationMetaByErrorCode(errorCode, recurrentPaymentContext.id)
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
                type: notificationMeta.type,
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            })
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
                url: notificationMeta.url,
                lastTry: false,
            })
        })

        const retryCases = [
            [RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE],
            [RECURRENT_PAYMENT_PROCESS_ERROR_CAN_NOT_REGISTER_MULTI_PAYMENT_CODE],
            [RECURRENT_PAYMENT_PROCESS_ERROR_ACQUIRING_PAYMENT_PROCEED_FAILED_CODE],
            [RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE],
            [RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_DISABLED_CODE],
            [RECURRENT_PAYMENT_PROCESS_ERROR_SERVICE_CONSUMER_NOT_FOUND_CODE],
        ]
        test.each(retryCases)('should set retry status and increase try count for %s errorCode', async (errorCode) => {
            const notificationMeta = getNotificationMetaByErrorCode(errorCode, recurrentPaymentContext.id)
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
                type: notificationMeta.type,
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            })
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
                url: notificationMeta.url,
                lastTry: false,
            })
        })

        const noRetryCases = [
            [RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE],
            [RECURRENT_PAYMENT_PROCESS_ERROR_NO_RECEIPTS_TO_PROCEED_CODE],
        ]
        test.each(noRetryCases)('should set error status and increase try count for %s errorCode', async (errorCode) => {
            const notificationMeta = getNotificationMetaByErrorCode(errorCode, recurrentPaymentContext.id)
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
                type: notificationMeta.type,
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            })
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
                url: notificationMeta.url,
                lastTry: false,
            })
        })

        it('should set error need retry status and increase try count for CONTEXT_NOT_FOUND errorCode', async () => {
            const errorCode = RECURRENT_PAYMENT_PROCESS_ERROR_CONTEXT_NOT_FOUND_CODE
            const notificationMeta = getNotificationMetaByErrorCode(errorCode, recurrentPaymentContext.id)
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

            const notifications = await Message.getAll(adminContext, {
                type: notificationMeta.type,
                uniqKey: `rp_${recurrentPayment.id}_1_false`,
            })
            expect(notifications).toHaveLength(0)
        })

        it('should set error status and send different notification message', async () => {
            const errorCode = RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE
            const notificationMeta = getNotificationMetaByErrorCode(errorCode, recurrentPaymentContext.id)
            const errorMessage = 'An error message'

            // create test recurrent payment
            const [recurrentPayment] = await createTestRecurrentPayment(
                admin,
                { ...getPaymentRequest(serviceConsumerBatch, recurrentPaymentContext), tryCount: RETRY_COUNT - 1 },
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
            expect(result.tryCount).toEqual(RETRY_COUNT)
            expect(result.state).toMatchObject({
                errorCode,
                errorMessage,
            })

            const notification = await Message.getOne(adminContext, {
                type: notificationMeta.type,
                uniqKey: `rp_${recurrentPayment.id}_${RETRY_COUNT}_false`,
            })
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                recurrentPaymentId: recurrentPayment.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                errorCode,
                url: notificationMeta.url,
                lastTry: true,
            })
        })

        it('should validate inputs', async () => {
            const errorCode = RECURRENT_PAYMENT_PROCESS_ERROR_LIMIT_EXCEEDED_CODE
            const errorMessage = 'An error message'

            await catchErrorFrom(async () => {
                await setRecurrentPaymentAsFailed(adminContext, null, errorMessage, errorCode)
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await setRecurrentPaymentAsFailed(adminContext, {}, errorMessage, errorCode)
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await setRecurrentPaymentAsFailed(adminContext, { id: faker.datatype.uuid() }, errorMessage, errorCode)
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await setRecurrentPaymentAsFailed(
                    adminContext,
                    { id: faker.datatype.uuid(), tryCount: 0 },
                    null,
                    errorCode,
                )
            }, (error) => {
                expect(error.message).toContain('invalid errorMessage argument')
            })

            await catchErrorFrom(async () => {
                await setRecurrentPaymentAsFailed(
                    adminContext,
                    { id: faker.datatype.uuid(), tryCount: 0 },
                    errorMessage,
                    null,
                )
            }, (error) => {
                expect(error.message).toContain('invalid errorCode argument')
            })
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
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/`,
            })
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
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/`,
            })
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
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/`,
            })
        })

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await sendTomorrowPaymentNotificationSafely(adminContext, null)
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await sendTomorrowPaymentNotificationSafely(adminContext, {})
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await sendTomorrowPaymentNotificationSafely(
                    adminContext,
                    recurrentPaymentContext,
                    null,
                )
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })

            await catchErrorFrom(async () => {
                await sendTomorrowPaymentNotificationSafely(
                    adminContext,
                    recurrentPaymentContext,
                    {},
                )
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPayment argument')
            })
        })
    })

    describe('sendTomorrowPaymentNoReceiptsNotificationSafely', () => {
        let admin,
            getContextRequest,
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
        })

        it('should send notification', async () => {
            // send notification
            await sendTomorrowPaymentNoReceiptsNotificationSafely(adminContext, recurrentPaymentContext)

            const [notification] = await Message.getAll(adminContext, {
                type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_NO_RECEIPTS_MESSAGE_TYPE,
                user: { id: serviceConsumerBatch.resident.user.id },
            }, {
                sortBy: 'createdAt_DESC',
            })
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/`,
            })
        })

        it('should send one notification for retry payment processing', async () => {
            // send notification
            await sendTomorrowPaymentNoReceiptsNotificationSafely(adminContext, recurrentPaymentContext)
            await sendTomorrowPaymentNoReceiptsNotificationSafely(adminContext, recurrentPaymentContext)

            const notifications = await Message.getAll(adminContext, {
                type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_NO_RECEIPTS_MESSAGE_TYPE,
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
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/`,
            })
        })

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await sendTomorrowPaymentNoReceiptsNotificationSafely(adminContext, null)
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await sendTomorrowPaymentNoReceiptsNotificationSafely(adminContext, {})
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })
        })
    })

    describe('sendTomorrowPaymentLimitExceedNotificationSafely', () => {
        let admin,
            getContextRequest,
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
        })

        it('should send notification', async () => {
            // send notification
            await sendTomorrowPaymentLimitExceedNotificationSafely(adminContext, recurrentPaymentContext, Big('1'))

            const [notification] = await Message.getAll(adminContext, {
                type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_LIMIT_EXCEED_MESSAGE_TYPE,
                user: { id: serviceConsumerBatch.resident.user.id },
            }, {
                sortBy: 'createdAt_DESC',
            })
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}/`,
                toPayAmount: '1',
            })
        })

        it('should send one notification for retry payment processing', async () => {
            // send notification
            await sendTomorrowPaymentLimitExceedNotificationSafely(adminContext, recurrentPaymentContext, '1')
            await sendTomorrowPaymentLimitExceedNotificationSafely(adminContext, recurrentPaymentContext, '1')

            const notifications = await Message.getAll(adminContext, {
                type: RECURRENT_PAYMENT_TOMORROW_PAYMENT_LIMIT_EXCEED_MESSAGE_TYPE,
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
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}/`,
                toPayAmount: '1',
            })
        })

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await sendTomorrowPaymentLimitExceedNotificationSafely(adminContext, null, '1')
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await sendTomorrowPaymentLimitExceedNotificationSafely(adminContext, {}, '1')
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await sendTomorrowPaymentLimitExceedNotificationSafely(adminContext, recurrentPaymentContext, null)
            }, (error) => {
                expect(error.message).toContain('invalid toPayAmount argument')
            })
        })
    })

    describe('sendNoReceiptsToProceedNotificationSafely', () => {
        let admin,
            getContextRequest,
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
        })

        it('should send notification', async () => {
            // send notification
            await sendNoReceiptsToProceedNotificationSafely(adminContext, recurrentPaymentContext)

            const [notification] = await Message.getAll(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE_TYPE,
                user: { id: serviceConsumerBatch.resident.user.id },
            }, {
                sortBy: 'createdAt_DESC',
            })
            expect(notification).toBeDefined()
            expect(notification).toHaveProperty('user')
            expect(notification.user).toHaveProperty('id')
            expect(notification.user.id).toEqual(serviceConsumerBatch.resident.user.id)
            expect(notification).toHaveProperty('meta')
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}`,
            })
        })

        it('should send one notification for retry payment processing', async () => {
            // send notification
            await sendNoReceiptsToProceedNotificationSafely(adminContext, recurrentPaymentContext)
            await sendNoReceiptsToProceedNotificationSafely(adminContext, recurrentPaymentContext)

            const notifications = await Message.getAll(adminContext, {
                type: RECURRENT_PAYMENT_PROCEEDING_NO_RECEIPTS_TO_PROCEED_ERROR_MESSAGE_TYPE,
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
            expect(notification.meta).toHaveProperty('data')
            expect(notification.meta.data).toHaveProperty('recurrentPaymentContextId')
            expect(notification.meta.data).toHaveProperty('serviceConsumerId')
            expect(notification.meta.data).toHaveProperty('residentId')
            expect(notification.meta.data).toHaveProperty('userId')

            expect(notification.meta.data).toMatchObject({
                recurrentPaymentContextId: recurrentPaymentContext.id,
                serviceConsumerId: serviceConsumerBatch.serviceConsumer.id,
                residentId: serviceConsumerBatch.resident.id,
                userId: serviceConsumerBatch.resident.user.id,
                url: `${conf.SERVER_URL}/payments/recurrent/${recurrentPaymentContext.id}`,
            })
        })

        it('should validate inputs', async () => {
            await catchErrorFrom(async () => {
                await sendNoReceiptsToProceedNotificationSafely(adminContext, null)
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })

            await catchErrorFrom(async () => {
                await sendNoReceiptsToProceedNotificationSafely(adminContext, {})
            }, (error) => {
                expect(error.message).toContain('invalid recurrentPaymentContext argument')
            })
        })
    })
})