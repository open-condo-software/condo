const dayjs = require('dayjs')

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}

jest.mock('@open-condo/keystone/fetch')
jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn(() => mockLogger),
}))

const { fetch } = require('@open-condo/keystone/fetch')

const {
    generateSignature,
    calculateNextRetryAt,
    trySendWebhookPayload,
} = require('./webhookPayload.utils')

const { WEBHOOK_PAYLOAD_TIMEOUT_MS, WEBHOOK_PAYLOAD_RETRY_INTERVALS } = require('../constants')


describe('webhookDelivery utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('generateSignature', () => {
        test('should generate consistent HMAC-SHA256 signature', () => {
            const body = '{"event":"test"}'
            const secret = 'test-secret'

            const signature1 = generateSignature(body, secret)
            const signature2 = generateSignature(body, secret)

            expect(signature1).toBe(signature2)
            expect(signature1).toHaveLength(64) // SHA256 hex is 64 chars
        })

        test('should generate different signatures for different bodies', () => {
            const secret = 'test-secret'

            const signature1 = generateSignature('{"event":"test1"}', secret)
            const signature2 = generateSignature('{"event":"test2"}', secret)

            expect(signature1).not.toBe(signature2)
        })

        test('should generate different signatures for different secrets', () => {
            const body = '{"event":"test"}'

            const signature1 = generateSignature(body, 'secret1')
            const signature2 = generateSignature(body, 'secret2')

            expect(signature1).not.toBe(signature2)
        })
    })

    describe('calculateNextRetryAt', () => {
        test('should return immediate retry for attempt 0', () => {
            const before = dayjs()
            const nextRetryAt = calculateNextRetryAt(0)
            const after = dayjs()

            const retryTime = dayjs(nextRetryAt)
            expect(retryTime.isAfter(before.subtract(1, 'second'))).toBe(true)
            expect(retryTime.isBefore(after.add(1, 'second'))).toBe(true)
        })

        test('should return 1 minute delay for attempt 1', () => {
            const before = dayjs()
            const nextRetryAt = calculateNextRetryAt(1)
            const retryTime = dayjs(nextRetryAt)

            const expectedDelay = WEBHOOK_PAYLOAD_RETRY_INTERVALS[1] // 60 seconds
            expect(retryTime.diff(before, 'second')).toBeGreaterThanOrEqual(expectedDelay - 1)
            expect(retryTime.diff(before, 'second')).toBeLessThanOrEqual(expectedDelay + 1)
        })

        test('should use last interval for attempts beyond array length', () => {
            const before = dayjs()
            const nextRetryAt = calculateNextRetryAt(100)
            const retryTime = dayjs(nextRetryAt)

            const lastInterval = WEBHOOK_PAYLOAD_RETRY_INTERVALS[WEBHOOK_PAYLOAD_RETRY_INTERVALS.length - 1]
            expect(retryTime.diff(before, 'second')).toBeGreaterThanOrEqual(lastInterval - 1)
            expect(retryTime.diff(before, 'second')).toBeLessThanOrEqual(lastInterval + 1)
        })
    })

    describe('trySendWebhookPayload', () => {
        const mockDelivery = {
            id: 'test-delivery-id',
            url: 'https://example.com/webhook',
            payload: { event: 'test.event', data: { test: true } },
            secret: 'test-secret',
            eventType: 'test.event',
            attempt: 0,
        }

        test('should return success for 2xx response', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue('{"received":true}'),
            })

            const result = await trySendWebhookPayload(mockDelivery)

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(200)
            expect(result.body).toBe('{"received":true}')
            expect(fetch).toHaveBeenCalledWith(
                mockDelivery.url,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': expect.any(String),
                        'X-Webhook-Event': 'test.event',
                        'X-Webhook-Delivery-Id': 'test-delivery-id',
                    }),
                    abortRequestTimeout: WEBHOOK_PAYLOAD_TIMEOUT_MS,
                })
            )
        })

        test('should return failure for 4xx/5xx response', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: jest.fn().mockResolvedValue('Server error'),
            })

            const result = await trySendWebhookPayload(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(500)
            expect(result.body).toBe('Server error')
            expect(result.error).toBe('HTTP 500: Internal Server Error')
        })

        test('should return failure for timeout', async () => {
            fetch.mockRejectedValue(new Error('Abort request by timeout'))

            const result = await trySendWebhookPayload(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.error).toContain('timeout')
        })

        test('should return failure for network error', async () => {
            fetch.mockRejectedValue(new Error('Connection refused'))

            const result = await trySendWebhookPayload(mockDelivery)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Connection refused')
        })

        test('should return failure if url is missing', async () => {
            const deliveryWithoutUrl = { ...mockDelivery, url: null }

            const result = await trySendWebhookPayload(deliveryWithoutUrl)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Missing required payload fields')
        })

        test('should return failure if payload is missing', async () => {
            const deliveryWithoutPayload = { ...mockDelivery, payload: null }

            const result = await trySendWebhookPayload(deliveryWithoutPayload)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Missing required payload fields')
        })

        test('should return failure if secret is missing', async () => {
            const deliveryWithoutSecret = { ...mockDelivery, secret: null }

            const result = await trySendWebhookPayload(deliveryWithoutSecret)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Missing required payload fields')
        })

        test('should truncate long response body', async () => {
            const longBody = 'x'.repeat(2000)
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue(longBody),
            })

            const result = await trySendWebhookPayload(mockDelivery)

            expect(result.success).toBe(true)
            expect(result.body).toHaveLength(1000) // WEBHOOK_MAX_RESPONSE_LENGTH
        })

        test('should handle payload as string', async () => {
            const deliveryWithStringPayload = {
                ...mockDelivery,
                payload: '{"event":"test"}',
            }

            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue('OK'),
            })

            const result = await trySendWebhookPayload(deliveryWithStringPayload)

            expect(result.success).toBe(true)
            expect(fetch).toHaveBeenCalledWith(
                mockDelivery.url,
                expect.objectContaining({
                    body: '{"event":"test"}',
                })
            )
        })

        test('should log info on successful delivery', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue('OK'),
            })

            await trySendWebhookPayload(mockDelivery)

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    msg: 'Sending webhook payload',
                })
            )
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    msg: 'Webhook payload delivered successfully',
                })
            )
        })

        test('should log warning on HTTP error', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: jest.fn().mockResolvedValue('Error'),
            })

            await trySendWebhookPayload(mockDelivery)

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    msg: 'Webhook payload delivery failed with HTTP error',
                })
            )
        })

        test('should log error on network error', async () => {
            fetch.mockRejectedValue(new Error('Connection refused'))

            await trySendWebhookPayload(mockDelivery)

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    msg: 'Webhook payload delivery failed with network error',
                })
            )
        })
    })
})
