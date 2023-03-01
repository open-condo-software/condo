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
    Payment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const {
    makePayerWithMultipleConsumers,
    createTestRecurrentPaymentContext,
    registerMultiPaymentByTestClient,
} = require('@condo/domains/acquiring/utils/testSchema')
const {
    ServiceConsumer,
} = require('@condo/domains/resident/utils/serverSchema')
const { makeClientWithServiceConsumer } = require('@condo/domains/resident/utils/testSchema')

const {
    getReadyForProcessingContextPage,
    getServiceConsumer,
    getReceiptsForServiceConsumer,
    filterPayedBillingReceipts,
} = require('./queries')


const { keystone } = index
const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'test-fingerprint-alphanumeric-value' } }

describe('recurrent payments queries', () => {
    let adminContext
    setFakeClientMode(index)

    beforeAll(async () => {
        adminContext = await keystone.createContext({ skipAccessControl: true })
    })

    describe('getReadyForProcessingContextPage', () => {
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
            const { batches } = await makePayerWithMultipleConsumers(2, 1)

            await createTestRecurrentPaymentContext(admin, getContextRequest(batches[0]))
            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: true,
            })

            const objs = await getReadyForProcessingContextPage(adminContext, date, 100, 0)
            expect(objs.length).toBeGreaterThanOrEqual(1)
            expect(objs).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    enabled: true,
                    paymentDay: date.date(),
                }),
            ]))
        })

        it('should return with autoPayReceipts=false only', async () => {
            const { batches } = await makePayerWithMultipleConsumers(2, 1)
            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                enabled: true,
            })
            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: true,
                autoPayReceipts: true,
                paymentDay: null,
            })

            const objs = await getReadyForProcessingContextPage(adminContext, date, 100, 0)
            expect(objs.length).toBeGreaterThanOrEqual(1)
            expect(objs).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    autoPayReceipts: false,
                    paymentDay: date.date(),
                }),
            ]))
        })

        it('should return with expected paymentDay only', async () => {
            const { batches } = await makePayerWithMultipleConsumers(3, 1)

            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                enabled: true,
                paymentDay: date.date() + 1,
            })

            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: true,
                paymentDay: date.date() - 1,
            })
            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[2]),
                paymentDay: date.date(),
                enabled: true,
            })

            const objs = await getReadyForProcessingContextPage(adminContext, date, 100, 0)
            expect(objs.length).toBeGreaterThanOrEqual(1)
            expect(objs).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    enabled: true,
                    paymentDay: date.date(),
                }),
            ]))
        })

        it('should return with paymentDay is greater (for last day of month)', async () => {
            const { batches } = await makePayerWithMultipleConsumers(4, 1)
            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[0]),
                enabled: true,
                paymentDay: 28,
            })
            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[1]),
                enabled: true,
                paymentDay: 29,
            })
            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[2]),
                enabled: true,
                paymentDay: 30,
            })
            await createTestRecurrentPaymentContext(admin, {
                ...getContextRequest(batches[3]),
                enabled: true,
                paymentDay: 31,
            })

            const date = dayjs('2023-02-28')
            const objs = await getReadyForProcessingContextPage(adminContext, date, 100, 0)
            expect(objs.length).toBeGreaterThanOrEqual(4)

            objs.forEach(obj => {
                expect(obj.paymentDay).toBeGreaterThanOrEqual(28)
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
            expect(serviceConsumer).toHaveProperty('billingIntegrationContext')
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

    describe('filterPayedBillingReceipts', () => {
        it('should return all receipts - no payments', async () => {
            const { batches } = await makePayerWithMultipleConsumers(1, 2)
            const [batch] = batches
            const {
                billingReceipts,
            } = batch

            // get receipts
            const receipts = await filterPayedBillingReceipts(adminContext, billingReceipts)

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
            const receipts = await filterPayedBillingReceipts(adminContext, billingReceipts)

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
            const receipts = await filterPayedBillingReceipts(adminContext, billingReceipts)
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
            const receipts = await filterPayedBillingReceipts(adminContext, billingReceipts)
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
            const receipts = await filterPayedBillingReceipts(adminContext, billingReceipts)
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
            const receipts = await filterPayedBillingReceipts(adminContext, billingReceipts)

            expect(receipts).toHaveLength(0)
        })
    })
})