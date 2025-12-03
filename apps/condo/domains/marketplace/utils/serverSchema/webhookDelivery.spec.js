/**
 * @jest-environment node
 */

const crypto = require('crypto')

const dayjs = require('dayjs')

jest.mock('@open-condo/config', () => ({
    INVOICE_WEBHOOK_SECRET: 'test-webhook-secret',
}))

jest.mock('@open-condo/keystone/fetch', () => ({
    fetch: jest.fn(),
}))

jest.mock('@open-condo/keystone/schema', () => ({
    getById: jest.fn(),
}))

const { fetch } = require('@open-condo/keystone/fetch')
const { getById } = require('@open-condo/keystone/schema')

const {
    buildWebhookPayload,
    generateSignature,
    calculateNextRetryAt,
    tryDeliverWebhook,
    FALLBACK_WEBHOOK_SECRET,
} = require('./webhookDelivery')

describe('webhookDelivery utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('FALLBACK_WEBHOOK_SECRET', () => {
        it('should use secret from config', () => {
            expect(FALLBACK_WEBHOOK_SECRET).toBe('test-webhook-secret')
        })
    })

    describe('generateSignature', () => {
        it('should generate HMAC-SHA256 signature with provided secret', () => {
            const body = JSON.stringify({ test: 'data' })
            const secret = 'my-custom-secret'
            const signature = generateSignature(body, secret)

            const expected = crypto
                .createHmac('sha256', secret)
                .update(body)
                .digest('hex')

            expect(signature).toBe(expected)
        })

        it('should generate different signatures for different payloads', () => {
            const secret = 'test-secret'
            const sig1 = generateSignature('{"a":1}', secret)
            const sig2 = generateSignature('{"a":2}', secret)

            expect(sig1).not.toBe(sig2)
        })

        it('should generate different signatures for different secrets', () => {
            const body = '{"test":"data"}'
            const sig1 = generateSignature(body, 'secret-1')
            const sig2 = generateSignature(body, 'secret-2')

            expect(sig1).not.toBe(sig2)
        })

        it('should generate consistent signatures for same payload and secret', () => {
            const body = '{"test":"data"}'
            const secret = 'consistent-secret'
            const sig1 = generateSignature(body, secret)
            const sig2 = generateSignature(body, secret)

            expect(sig1).toBe(sig2)
        })
    })

    describe('calculateNextRetryAt', () => {
        it('should return immediate time for attempt 0', () => {
            const before = dayjs()
            const result = calculateNextRetryAt(0)
            const after = dayjs()

            const resultTime = dayjs(result)
            expect(resultTime.isAfter(before.subtract(1, 'second'))).toBe(true)
            expect(resultTime.isBefore(after.add(1, 'second'))).toBe(true)
        })

        it('should return 1 minute delay for attempt 1', () => {
            const before = dayjs()
            const result = calculateNextRetryAt(1)
            const resultTime = dayjs(result)

            const expectedMin = before.add(59, 'second')
            const expectedMax = before.add(61, 'second')

            expect(resultTime.isAfter(expectedMin)).toBe(true)
            expect(resultTime.isBefore(expectedMax)).toBe(true)
        })

        it('should return 5 minute delay for attempt 2', () => {
            const before = dayjs()
            const result = calculateNextRetryAt(2)
            const resultTime = dayjs(result)

            const expectedMin = before.add(4, 'minute')
            const expectedMax = before.add(6, 'minute')

            expect(resultTime.isAfter(expectedMin)).toBe(true)
            expect(resultTime.isBefore(expectedMax)).toBe(true)
        })

        it('should cap at last interval for high attempt numbers', () => {
            const before = dayjs()
            const result = calculateNextRetryAt(100)
            const resultTime = dayjs(result)

            // Last interval is 24 hours
            const expectedMin = before.add(23, 'hour')
            const expectedMax = before.add(25, 'hour')

            expect(resultTime.isAfter(expectedMin)).toBe(true)
            expect(resultTime.isBefore(expectedMax)).toBe(true)
        })
    })

    describe('buildWebhookPayload', () => {
        const mockInvoice = {
            id: 'invoice-123',
            number: 42,
            organization: 'org-456',
            toPay: '1500.00',
            paidAt: '2024-01-15T10:30:00.000Z',
            publishedAt: '2024-01-14T09:00:00.000Z',
            canceledAt: null,
        }

        const mockOrganization = {
            id: 'org-456',
            name: 'Test Organization',
        }

        const mockDelivery = {
            id: 'delivery-789',
            invoice: 'invoice-123',
            previousStatus: 'draft',
            newStatus: 'published',
            attempt: 0,
            nextRetryAt: '2024-01-15T10:31:00.000Z',
            expiresAt: '2024-01-22T10:30:00.000Z',
        }

        beforeEach(() => {
            getById.mockImplementation((model, id) => {
                if (model === 'Invoice' && id === 'invoice-123') return mockInvoice
                if (model === 'Organization' && id === 'org-456') return mockOrganization
                return null
            })
        })

        it('should build correct payload structure', async () => {
            const payload = await buildWebhookPayload(mockDelivery)

            expect(payload.event).toBe('invoice.status.changed')
            expect(payload.deliveryId).toBe('delivery-789')
            expect(payload.attempt).toBe(1) // attempt + 1
            expect(payload.nextRetryAt).toBe('2024-01-15T10:31:00.000Z')
            expect(payload.expiresAt).toBe('2024-01-22T10:30:00.000Z')
            expect(payload.timestamp).toBeDefined()
        })

        it('should include invoice data in payload', async () => {
            const payload = await buildWebhookPayload(mockDelivery)

            expect(payload.data.invoiceId).toBe('invoice-123')
            expect(payload.data.invoiceNumber).toBe(42)
            expect(payload.data.previousStatus).toBe('draft')
            expect(payload.data.newStatus).toBe('published')
            expect(payload.data.toPay).toBe('1500.00')
        })

        it('should include organization data in payload', async () => {
            const payload = await buildWebhookPayload(mockDelivery)

            expect(payload.data.organization.id).toBe('org-456')
            expect(payload.data.organization.name).toBe('Test Organization')
        })

        it('should throw error if invoice not found', async () => {
            getById.mockImplementation(() => null)

            await expect(buildWebhookPayload(mockDelivery)).rejects.toThrow('Invoice not found')
        })
    })

    describe('tryDeliverWebhook', () => {
        const mockDelivery = {
            id: 'delivery-123',
            invoice: 'invoice-456',
            callbackUrl: 'https://example.com/webhook',
            previousStatus: 'draft',
            newStatus: 'published',
            attempt: 0,
            nextRetryAt: '2024-01-15T10:31:00.000Z',
            expiresAt: '2024-01-22T10:30:00.000Z',
        }

        const mockInvoice = {
            id: 'invoice-456',
            number: 1,
            organization: 'org-789',
            toPay: '100.00',
            paidAt: null,
            publishedAt: '2024-01-15T10:00:00.000Z',
            canceledAt: null,
            statusChangeCallbackSecret: 'per-invoice-secret-123',
        }

        const mockOrganization = {
            id: 'org-789',
            name: 'Test Org',
        }

        beforeEach(() => {
            getById.mockImplementation((model, id) => {
                if (model === 'Invoice') return mockInvoice
                if (model === 'Organization') return mockOrganization
                return null
            })
        })

        it('should return success on 2xx response', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue('{"received": true}'),
            })

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(200)
            expect(result.body).toBe('{"received": true}')
        })

        it('should send correct headers', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: jest.fn().mockResolvedValue('ok'),
            })

            await tryDeliverWebhook(mockDelivery)

            expect(fetch).toHaveBeenCalledWith(
                'https://example.com/webhook',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'X-Condo-Event': 'invoice.status.changed',
                        'X-Condo-Delivery-Id': 'delivery-123',
                    }),
                })
            )

            // Check signature header exists
            const callArgs = fetch.mock.calls[0][1]
            expect(callArgs.headers['X-Condo-Signature']).toBeDefined()
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
            expect(result.body).toBe('Invalid payload')
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
        })

        it('should handle timeout error', async () => {
            fetch.mockRejectedValue(new Error('Abort request by timeout'))

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.error).toContain('timeout')
        })

        it('should handle network error', async () => {
            fetch.mockRejectedValue(new Error('ECONNREFUSED'))

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.error).toBe('ECONNREFUSED')
        })

        it('should truncate long response body', async () => {
            const longBody = 'x'.repeat(2000)
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: jest.fn().mockResolvedValue(longBody),
            })

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.body.length).toBe(1000)
        })

        it('should return error if payload build fails', async () => {
            getById.mockImplementation(() => null)

            const result = await tryDeliverWebhook(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Failed to build payload')
        })

        it('should use abortRequestTimeout option', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: jest.fn().mockResolvedValue('ok'),
            })

            await tryDeliverWebhook(mockDelivery)

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    abortRequestTimeout: 30000,
                    maxRetries: 0,
                })
            )
        })

        it('should use invoice-specific secret for signature', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: jest.fn().mockResolvedValue('ok'),
            })

            await tryDeliverWebhook(mockDelivery)

            const callArgs = fetch.mock.calls[0][1]
            const body = callArgs.body
            const signature = callArgs.headers['X-Condo-Signature']

            // Verify signature was generated with invoice-specific secret
            const expectedSignature = crypto
                .createHmac('sha256', 'per-invoice-secret-123')
                .update(body)
                .digest('hex')

            expect(signature).toBe(expectedSignature)
        })

        it('should fallback to global secret when invoice has no secret', async () => {
            const invoiceWithoutSecret = { ...mockInvoice, statusChangeCallbackSecret: null }
            getById.mockImplementation((model, id) => {
                if (model === 'Invoice') return invoiceWithoutSecret
                if (model === 'Organization') return mockOrganization
                return null
            })

            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: jest.fn().mockResolvedValue('ok'),
            })

            await tryDeliverWebhook(mockDelivery)

            const callArgs = fetch.mock.calls[0][1]
            const body = callArgs.body
            const signature = callArgs.headers['X-Condo-Signature']

            // Verify signature was generated with fallback secret
            const expectedSignature = crypto
                .createHmac('sha256', 'test-webhook-secret')
                .update(body)
                .digest('hex')

            expect(signature).toBe(expectedSignature)
        })
    })
})
