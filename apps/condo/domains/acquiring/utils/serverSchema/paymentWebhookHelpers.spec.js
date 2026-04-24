/**
 * @jest-environment node
 */
const { faker } = require('@faker-js/faker')

const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager')
jest.mock('@open-condo/keystone/schema', () => ({
    getSchemaCtx: jest.fn().mockResolvedValue({ keystone: {} }),
    getById: jest.fn(),
}))
const { getById } = require('@open-condo/keystone/schema')

// Use real EncryptionManager to encrypt test secrets
const encryptionManager = new EncryptionManager()

const {
    getWebhookConfig,
    buildPaymentWebhookPayload,
} = require('./paymentWebhookHelpers')

describe('paymentWebhookHelpers', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getWebhookConfig', () => {
        test('should return url and secret from invoice when payment has invoice', async () => {
            const mockUrl = faker.internet.url()
            const mockSecret = faker.random.alphaNumeric(32)
            const encryptedSecret = encryptionManager.encrypt(mockSecret)

            const payment = { invoice: faker.datatype.uuid(), receipt: faker.datatype.uuid() }
            const invoice = {
                paymentStatusChangeWebhookUrl: mockUrl,
                paymentStatusChangeWebhookSecret: encryptedSecret,
            }

            getById.mockResolvedValue(invoice)

            const result = await getWebhookConfig(payment)

            expect(getById).toHaveBeenCalledTimes(1)
            expect(getById).toHaveBeenCalledWith('Invoice', payment.invoice)
            expect(result).toEqual({ url: mockUrl, secret: mockSecret })
        })

        test('should return url and secret from receipt when payment has receipt and no invoice', async () => {
            const mockUrl = faker.internet.url()
            const mockSecret = faker.random.alphaNumeric(32)
            const encryptedSecret = encryptionManager.encrypt(mockSecret)

            const payment = { receipt: faker.datatype.uuid() }
            const receipt = {
                paymentStatusChangeWebhookUrl: mockUrl,
                paymentStatusChangeWebhookSecret: encryptedSecret,
            }

            getById.mockResolvedValue(receipt)

            const result = await getWebhookConfig(payment)

            expect(getById).toHaveBeenCalledTimes(1)
            expect(getById).toHaveBeenCalledWith('BillingReceipt', payment.receipt)
            expect(result).toEqual({ url: mockUrl, secret: mockSecret })
        })

        test('should return nulls when payment has neither invoice nor receipt', async () => {
            const payment = {}

            const result = await getWebhookConfig(payment)

            expect(getById).not.toHaveBeenCalled()
            expect(result).toEqual({ url: null, secret: null })
        })
    })

    describe('buildPaymentWebhookPayload', () => {
        const mockOrganization = {
            id: faker.datatype.uuid(),
            name: 'Test Organization',
        }

        test('should build payment snapshot with correct structure for invoice payment', async () => {
            const mockInvoice = {
                id: faker.datatype.uuid(),
                number: 123,
                toPay: '1000.00',
            }
            const createdAt = new Date().toISOString()
            const updatedAt = new Date().toISOString()
            const payment = {
                id: faker.datatype.uuid(),
                status: 'PROCESSING',
                amount: '500.00',
                currencyCode: 'RUB',
                organization: faker.datatype.uuid(),
                invoice: faker.datatype.uuid(),
                receipt: null,
                createdAt,
                updatedAt,
            }

            getById
                .mockResolvedValueOnce(mockOrganization) // Organization
                .mockResolvedValueOnce(mockInvoice) // Invoice

            const result = await buildPaymentWebhookPayload(payment)

            expect(result).toMatchObject({
                __typename: 'Payment',
                id: payment.id,
                status: 'PROCESSING',
                amount: payment.amount,
                currencyCode: payment.currencyCode,
                v: undefined,
                dv: undefined,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                organization: {
                    __typename: 'Organization',
                    id: mockOrganization.id,
                    name: mockOrganization.name,
                },
                invoice: {
                    __typename: 'Invoice',
                    id: mockInvoice.id,
                    number: mockInvoice.number,
                    toPay: mockInvoice.toPay,
                },
                receipt: null,
            })
        })

        test('should build payment snapshot with correct structure for receipt payment', async () => {
            const mockReceipt = {
                id: faker.datatype.uuid(),
                toPay: '2000.00',
                period: '2024-01-01',
            }
            const createdAt = new Date().toISOString()
            const updatedAt = new Date().toISOString()
            const payment = {
                id: faker.datatype.uuid(),
                status: 'DONE',
                amount: '2000.00',
                currencyCode: 'RUB',
                accountNumber: '1234567890',
                organization: faker.datatype.uuid(),
                invoice: null,
                receipt: faker.datatype.uuid(),
                createdAt,
                updatedAt,
            }

            getById
                .mockResolvedValueOnce(mockOrganization) // Organization
                .mockResolvedValueOnce(mockReceipt) // Receipt

            const result = await buildPaymentWebhookPayload(payment)

            expect(result).toMatchObject({
                __typename: 'Payment',
                id: payment.id,
                status: 'DONE',
                amount: payment.amount,
                currencyCode: payment.currencyCode,
                v: undefined,
                dv: undefined,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                organization: {
                    __typename: 'Organization',
                    id: mockOrganization.id,
                    name: mockOrganization.name,
                },
                invoice: null,
                receipt: {
                    __typename: 'BillingReceipt',
                    id: mockReceipt.id,
                    toPay: mockReceipt.toPay,
                    period: mockReceipt.period,
                    accountNumber: payment.accountNumber,
                },
            })
        })

        test('should set invoice and receipt to null when payment has neither', async () => {
            const payment = {
                id: faker.datatype.uuid(),
                status: 'CANCELLED',
                amount: '100.00',
                currencyCode: 'RUB',
                organization: faker.datatype.uuid(),
                invoice: null,
                receipt: null,
            }

            getById.mockResolvedValueOnce(mockOrganization)

            const result = await buildPaymentWebhookPayload(payment)

            expect(result.invoice).toBeNull()
            expect(result.receipt).toBeNull()
        })
    })
})
