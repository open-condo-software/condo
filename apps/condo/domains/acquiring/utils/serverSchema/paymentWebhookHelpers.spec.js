/**
 * @jest-environment node
 */
const { faker } = require('@faker-js/faker')

jest.mock('@open-condo/keystone/schema', () => ({
    getSchemaCtx: jest.fn().mockResolvedValue({ keystone: {} }),
    getById: jest.fn(),
}))

const { getById } = require('@open-condo/keystone/schema')

const {
    getWebhookSecret,
    getWebhookCallbackUrl,
    buildPaymentWebhookPayload,
} = require('./paymentWebhookHelpers')

describe('paymentWebhookHelpers', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getWebhookSecret', () => {
        test('should return secret from invoice when payment has invoice', async () => {
            const mockSecret = faker.random.alphaNumeric(32)
            const payment = { invoice: faker.datatype.uuid() }
            const invoice = { paymentStatusChangeWebhookSecret: mockSecret }

            getById.mockResolvedValue(invoice)

            const result = await getWebhookSecret(payment)

            expect(getById).toHaveBeenCalledWith('Invoice', payment.invoice)
            expect(result).toBe(mockSecret)
        })

        test('should return secret from receipt when payment has receipt', async () => {
            const mockSecret = faker.random.alphaNumeric(32)
            const payment = { receipt: faker.datatype.uuid() }
            const receipt = { paymentStatusChangeWebhookSecret: mockSecret }

            getById.mockResolvedValue(receipt)

            const result = await getWebhookSecret(payment)

            expect(getById).toHaveBeenCalledWith('BillingReceipt', payment.receipt)
            expect(result).toBe(mockSecret)
        })

        test('should return null when payment has neither invoice nor receipt', async () => {
            const payment = {}

            const result = await getWebhookSecret(payment)

            expect(getById).not.toHaveBeenCalled()
            expect(result).toBeNull()
        })
    })

    describe('getWebhookCallbackUrl', () => {
        test('should return URL from invoice when payment has invoice', async () => {
            const mockUrl = faker.internet.url()
            const payment = { invoice: faker.datatype.uuid() }
            const invoice = { paymentStatusChangeWebhookUrl: mockUrl }

            getById.mockResolvedValue(invoice)

            const result = await getWebhookCallbackUrl(payment)

            expect(getById).toHaveBeenCalledWith('Invoice', payment.invoice)
            expect(result).toBe(mockUrl)
        })

        test('should return URL from receipt when payment has receipt', async () => {
            const mockUrl = faker.internet.url()
            const payment = { receipt: faker.datatype.uuid() }
            const receipt = { paymentStatusChangeWebhookUrl: mockUrl }

            getById.mockResolvedValue(receipt)

            const result = await getWebhookCallbackUrl(payment)

            expect(getById).toHaveBeenCalledWith('BillingReceipt', payment.receipt)
            expect(result).toBe(mockUrl)
        })

        test('should return null when payment has neither invoice nor receipt', async () => {
            const payment = {}

            const result = await getWebhookCallbackUrl(payment)

            expect(getById).not.toHaveBeenCalled()
            expect(result).toBeNull()
        })
    })

    describe('buildPaymentWebhookPayload', () => {
        const mockOrganization = {
            id: faker.datatype.uuid(),
            name: 'Test Organization',
        }

        test('should build payload with correct structure for invoice payment', async () => {
            const mockInvoice = {
                id: faker.datatype.uuid(),
                number: 123,
                toPay: '1000.00',
            }
            const payment = {
                id: faker.datatype.uuid(),
                amount: '500.00',
                currencyCode: 'RUB',
                organization: faker.datatype.uuid(),
                invoice: faker.datatype.uuid(),
                receipt: null,
            }

            getById
                .mockResolvedValueOnce(mockOrganization) // Organization
                .mockResolvedValueOnce(mockInvoice) // Invoice

            const result = await buildPaymentWebhookPayload(payment, 'CREATED', 'PROCESSING')

            expect(result).toEqual({
                eventType: 'payment.status.changed',
                timestamp: expect.any(String),
                data: {
                    paymentId: payment.id,
                    previousStatus: 'CREATED',
                    newStatus: 'PROCESSING',
                    amount: payment.amount,
                    currencyCode: payment.currencyCode,
                    organization: {
                        id: mockOrganization.id,
                        name: mockOrganization.name,
                    },
                    invoice: {
                        id: mockInvoice.id,
                        number: mockInvoice.number,
                        toPay: mockInvoice.toPay,
                    },
                    receipt: null,
                },
            })
        })

        test('should build payload with correct structure for receipt payment', async () => {
            const mockReceipt = {
                id: faker.datatype.uuid(),
                toPay: '2000.00',
                period: '2024-01-01',
            }
            const payment = {
                id: faker.datatype.uuid(),
                amount: '2000.00',
                currencyCode: 'RUB',
                accountNumber: '1234567890',
                organization: faker.datatype.uuid(),
                invoice: null,
                receipt: faker.datatype.uuid(),
            }

            getById
                .mockResolvedValueOnce(mockOrganization) // Organization
                .mockResolvedValueOnce(mockReceipt) // Receipt

            const result = await buildPaymentWebhookPayload(payment, 'PROCESSING', 'DONE')

            expect(result).toEqual({
                eventType: 'payment.status.changed',
                timestamp: expect.any(String),
                data: {
                    paymentId: payment.id,
                    previousStatus: 'PROCESSING',
                    newStatus: 'DONE',
                    amount: payment.amount,
                    currencyCode: payment.currencyCode,
                    organization: {
                        id: mockOrganization.id,
                        name: mockOrganization.name,
                    },
                    invoice: null,
                    receipt: {
                        id: mockReceipt.id,
                        toPay: mockReceipt.toPay,
                        period: mockReceipt.period,
                        accountNumber: payment.accountNumber,
                    },
                },
            })
        })

        test('should set invoice and receipt to null when payment has neither', async () => {
            const payment = {
                id: faker.datatype.uuid(),
                amount: '100.00',
                currencyCode: 'RUB',
                organization: faker.datatype.uuid(),
                invoice: null,
                receipt: null,
            }

            getById.mockResolvedValueOnce(mockOrganization)

            const result = await buildPaymentWebhookPayload(payment, 'CREATED', 'CANCELLED')

            expect(result.data.invoice).toBeNull()
            expect(result.data.receipt).toBeNull()
        })

        test('should include valid ISO timestamp', async () => {
            const payment = {
                id: faker.datatype.uuid(),
                amount: '100.00',
                currencyCode: 'RUB',
                organization: faker.datatype.uuid(),
                invoice: null,
                receipt: null,
            }

            getById.mockResolvedValueOnce(mockOrganization)

            const before = new Date()
            const result = await buildPaymentWebhookPayload(payment, 'CREATED', 'DONE')
            const after = new Date()

            const timestamp = new Date(result.timestamp)
            expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
            expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
        })
    })
})
