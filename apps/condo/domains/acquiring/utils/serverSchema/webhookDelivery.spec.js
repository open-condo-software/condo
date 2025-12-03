/**
 * @jest-environment node
 */

const crypto = require('crypto')

const dayjs = require('dayjs')

jest.mock('@open-condo/keystone/fetch')
jest.mock('@open-condo/keystone/logging')
jest.mock('@open-condo/keystone/schema')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const { getById } = require('@open-condo/keystone/schema')

const {
    PAYMENT_WEBHOOK_TIMEOUT_MS,
    PAYMENT_WEBHOOK_MAX_RESPONSE_LENGTH,
    PAYMENT_WEBHOOK_RETRY_INTERVALS,
} = require('@condo/domains/acquiring/constants/webhook')

const {
    buildWebhookPayload,
    generateSignature,
    calculateNextRetryAt,
    tryDeliverWebhook,
    getWebhookSecret,
    getWebhookCallbackUrl,
} = require('./webhookDelivery')


describe('webhookDelivery', () => {
    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        getLogger.mockReturnValue(mockLogger)
    })

    describe('generateSignature', () => {
        it('should generate HMAC-SHA256 signature', () => {
            const body = '{"test":"data"}'
            const secret = 'test-secret'

            const signature = generateSignature(body, secret)

            const expected = crypto
                .createHmac('sha256', secret)
                .update(body)
                .digest('hex')

            expect(signature).toBe(expected)
        })

        it('should generate different signatures for different secrets', () => {
            const body = '{"test":"data"}'

            const signature1 = generateSignature(body, 'secret1')
            const signature2 = generateSignature(body, 'secret2')

            expect(signature1).not.toBe(signature2)
        })

        it('should generate different signatures for different bodies', () => {
            const secret = 'test-secret'

            const signature1 = generateSignature('{"a":1}', secret)
            const signature2 = generateSignature('{"b":2}', secret)

            expect(signature1).not.toBe(signature2)
        })
    })

    describe('calculateNextRetryAt', () => {
        it('should return immediate retry for first attempt', () => {
            const before = dayjs()
            const result = calculateNextRetryAt(0)
            const after = dayjs()

            const resultTime = dayjs(result)
            expect(resultTime.isAfter(before) || resultTime.isSame(before)).toBe(true)
            expect(resultTime.isBefore(after.add(1, 'second'))).toBe(true)
        })

        it('should return 1 minute delay for second attempt', () => {
            const before = dayjs()
            const result = calculateNextRetryAt(1)

            const resultTime = dayjs(result)
            const expectedMin = before.add(60, 'second')

            expect(resultTime.isAfter(expectedMin.subtract(1, 'second'))).toBe(true)
        })

        it('should use last interval for attempts beyond array length', () => {
            const before = dayjs()
            const result = calculateNextRetryAt(100)

            const resultTime = dayjs(result)
            const lastInterval = PAYMENT_WEBHOOK_RETRY_INTERVALS[PAYMENT_WEBHOOK_RETRY_INTERVALS.length - 1]
            const expectedMin = before.add(lastInterval, 'second')

            expect(resultTime.isAfter(expectedMin.subtract(1, 'second'))).toBe(true)
        })
    })

    describe('buildWebhookPayload', () => {
        const mockPayment = {
            id: 'payment-uuid',
            organization: 'org-uuid',
            invoice: 'invoice-uuid',
            receipt: null,
            amount: '1500.00',
            currencyCode: 'RUB',
            accountNumber: '123456789',
        }

        const mockOrganization = {
            id: 'org-uuid',
            name: 'Test Organization',
        }

        const mockInvoice = {
            id: 'invoice-uuid',
            number: 123,
            status: 'paid',
            toPay: '1500.00',
        }

        const mockDelivery = {
            id: 'delivery-uuid',
            payment: 'payment-uuid',
            previousStatus: 'PROCESSING',
            newStatus: 'DONE',
            attempt: 0,
            nextRetryAt: '2024-01-15T10:31:00.000Z',
            expiresAt: '2024-01-22T10:30:00.000Z',
        }

        it('should build payload with invoice data', async () => {
            getById.mockImplementation((model, id) => {
                if (model === 'Payment') return mockPayment
                if (model === 'Organization') return mockOrganization
                if (model === 'Invoice') return mockInvoice
                return null
            })

            const payload = await buildWebhookPayload(mockDelivery)

            expect(payload.event).toBe('payment.status.changed')
            expect(payload.deliveryId).toBe('delivery-uuid')
            expect(payload.attempt).toBe(1)
            expect(payload.data.paymentId).toBe('payment-uuid')
            expect(payload.data.previousStatus).toBe('PROCESSING')
            expect(payload.data.newStatus).toBe('DONE')
            expect(payload.data.amount).toBe('1500.00')
            expect(payload.data.organization.id).toBe('org-uuid')
            expect(payload.data.invoice).toEqual({
                id: 'invoice-uuid',
                number: 123,
                status: 'paid',
                toPay: '1500.00',
            })
            expect(payload.data.receipt).toBeNull()
        })

        it('should build payload with receipt data', async () => {
            const paymentWithReceipt = { ...mockPayment, invoice: null, receipt: 'receipt-uuid' }
            const mockReceipt = {
                id: 'receipt-uuid',
                toPay: '2000.00',
                period: '2024-01-01',
            }

            getById.mockImplementation((model, id) => {
                if (model === 'Payment') return paymentWithReceipt
                if (model === 'Organization') return mockOrganization
                if (model === 'BillingReceipt') return mockReceipt
                return null
            })

            const payload = await buildWebhookPayload(mockDelivery)

            expect(payload.data.invoice).toBeNull()
            expect(payload.data.receipt).toEqual({
                id: 'receipt-uuid',
                toPay: '2000.00',
                period: '2024-01-01',
            })
        })

        it('should throw error if payment not found', async () => {
            getById.mockReturnValue(null)

            await expect(buildWebhookPayload(mockDelivery)).rejects.toThrow('Payment not found')
        })
    })

    describe('getWebhookSecret', () => {
        it('should return secret from invoice', async () => {
            const payment = { invoice: 'invoice-uuid', receipt: null }
            const invoice = { statusChangeCallbackSecret: 'invoice-secret' }

            getById.mockImplementation((model) => {
                if (model === 'Invoice') return invoice
                return null
            })

            const secret = await getWebhookSecret(payment)
            expect(secret).toBe('invoice-secret')
        })

        it('should return secret from receipt if invoice has no secret', async () => {
            const payment = { invoice: 'invoice-uuid', receipt: 'receipt-uuid' }
            const invoice = { statusChangeCallbackSecret: null }
            const receipt = { statusChangeCallbackSecret: 'receipt-secret' }

            getById.mockImplementation((model) => {
                if (model === 'Invoice') return invoice
                if (model === 'BillingReceipt') return receipt
                return null
            })

            const secret = await getWebhookSecret(payment)
            expect(secret).toBe('receipt-secret')
        })

        it('should return null if no secret found', async () => {
            const payment = { invoice: null, receipt: null }

            getById.mockReturnValue(null)

            const secret = await getWebhookSecret(payment)
            expect(secret).toBeNull()
        })
    })

    describe('getWebhookCallbackUrl', () => {
        it('should return callback URL from invoice', async () => {
            const payment = { invoice: 'invoice-uuid', receipt: null }
            const invoice = { statusChangeCallbackUrl: 'https://example.com/webhook' }

            getById.mockImplementation((model) => {
                if (model === 'Invoice') return invoice
                return null
            })

            const url = await getWebhookCallbackUrl(payment)
            expect(url).toBe('https://example.com/webhook')
        })

        it('should return callback URL from receipt if invoice has no URL', async () => {
            const payment = { invoice: 'invoice-uuid', receipt: 'receipt-uuid' }
            const invoice = { statusChangeCallbackUrl: null }
            const receipt = { statusChangeCallbackUrl: 'https://receipt.example.com/webhook' }

            getById.mockImplementation((model) => {
                if (model === 'Invoice') return invoice
                if (model === 'BillingReceipt') return receipt
                return null
            })

            const url = await getWebhookCallbackUrl(payment)
            expect(url).toBe('https://receipt.example.com/webhook')
        })

        it('should return null if no callback URL found', async () => {
            const payment = { invoice: null, receipt: null }

            getById.mockReturnValue(null)

            const url = await getWebhookCallbackUrl(payment)
            expect(url).toBeNull()
        })
    })

    describe('tryDeliverWebhook', () => {
        const mockPayment = {
            id: 'payment-uuid',
            organization: 'org-uuid',
            invoice: 'invoice-uuid',
            receipt: null,
            amount: '1500.00',
            currencyCode: 'RUB',
            accountNumber: '123456789',
        }

        const mockOrganization = {
            id: 'org-uuid',
            name: 'Test Organization',
        }

        const mockInvoice = {
            id: 'invoice-uuid',
            number: 123,
            status: 'paid',
            toPay: '1500.00',
            statusChangeCallbackSecret: 'test-secret',
        }

        const mockDelivery = {
            id: 'delivery-uuid',
            payment: 'payment-uuid',
            callbackUrl: 'https://example.com/webhook',
            previousStatus: 'PROCESSING',
            newStatus: 'DONE',
            attempt: 0,
            nextRetryAt: '2024-01-15T10:31:00.000Z',
            expiresAt: '2024-01-22T10:30:00.000Z',
        }

        beforeEach(() => {
            getById.mockImplementation((model, id) => {
                if (model === 'Payment') return mockPayment
                if (model === 'Organization') return mockOrganization
                if (model === 'Invoice') return mockInvoice
                return null
            })
        })

        it('should return success on 200 response', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue('{"received":true}'),
            })

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(200)
            expect(result.body).toBe('{"received":true}')
        })

        it('should return failure on 4xx response', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: jest.fn().mockResolvedValue('Invalid payload'),
            })

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(400)
            expect(result.error).toContain('HTTP 400')
        })

        it('should return failure on 5xx response', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: jest.fn().mockResolvedValue('Server error'),
            })

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(500)
            expect(result.error).toContain('HTTP 500')
        })

        it('should return failure on network error', async () => {
            fetch.mockRejectedValue(new Error('Network error'))

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Network error')
        })

        it('should return failure on timeout', async () => {
            fetch.mockRejectedValue(new Error('Abort request by timeout'))

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.error).toContain('timeout')
        })

        it('should return failure if no secret configured', async () => {
            const invoiceWithoutSecret = { ...mockInvoice, statusChangeCallbackSecret: null }
            getById.mockImplementation((model, id) => {
                if (model === 'Payment') return mockPayment
                if (model === 'Organization') return mockOrganization
                if (model === 'Invoice') return invoiceWithoutSecret
                return null
            })

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.error).toContain('No webhook secret')
        })

        it('should truncate long response body', async () => {
            const longBody = 'x'.repeat(PAYMENT_WEBHOOK_MAX_RESPONSE_LENGTH + 500)
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue(longBody),
            })

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(true)
            expect(result.body.length).toBe(PAYMENT_WEBHOOK_MAX_RESPONSE_LENGTH)
        })

        it('should send correct headers', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue('ok'),
            })

            await tryDeliverWebhook(mockDelivery)

            expect(fetch).toHaveBeenCalledWith(
                'https://example.com/webhook',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'X-Condo-Event': 'payment.status.changed',
                        'X-Condo-Delivery-Id': 'delivery-uuid',
                    }),
                    abortRequestTimeout: PAYMENT_WEBHOOK_TIMEOUT_MS,
                })
            )

            // Verify signature header is present
            const callArgs = fetch.mock.calls[0][1]
            expect(callArgs.headers['X-Condo-Signature']).toBeDefined()
        })

        it('should use invoice secret for signature', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue('ok'),
            })

            await tryDeliverWebhook(mockDelivery)

            const callArgs = fetch.mock.calls[0][1]
            const body = callArgs.body
            const expectedSignature = generateSignature(body, 'test-secret')

            expect(callArgs.headers['X-Condo-Signature']).toBe(expectedSignature)
        })
    })
})
