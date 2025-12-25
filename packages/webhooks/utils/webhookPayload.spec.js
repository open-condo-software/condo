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

const { fetch, TimeoutError } = require('@open-condo/keystone/fetch')
const { WEBHOOK_PAYLOAD_RETRY_INTERVALS_IN_SEC, WEBHOOK_PAYLOAD_TIMEOUT_IN_MS } = require('@open-condo/webhooks/constants')

const {
    generateSignature,
    calculateNextRetryAt,
    trySendWebhookPayload,
} = require('./webhookPayload')



describe('webhookPayload utilities', () => {
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

            const expectedDelay = WEBHOOK_PAYLOAD_RETRY_INTERVALS_IN_SEC[1] // 60 seconds
            expect(retryTime.diff(before, 'second')).toBeGreaterThanOrEqual(expectedDelay - 1)
            expect(retryTime.diff(before, 'second')).toBeLessThanOrEqual(expectedDelay + 1)
        })

        test('should use last interval for attempts beyond array length', () => {
            const before = dayjs()
            const nextRetryAt = calculateNextRetryAt(100)
            const retryTime = dayjs(nextRetryAt)

            const lastInterval = WEBHOOK_PAYLOAD_RETRY_INTERVALS_IN_SEC[WEBHOOK_PAYLOAD_RETRY_INTERVALS_IN_SEC.length - 1]
            expect(retryTime.diff(before, 'second')).toBeGreaterThanOrEqual(lastInterval - 1)
            expect(retryTime.diff(before, 'second')).toBeLessThanOrEqual(lastInterval + 1)
        })
    })

    describe('trySendWebhookPayload', () => {
        const mockWebhookPayload = {
            id: 'test-webhook-payload-id',
            url: 'https://example.com/webhook',
            payload: '{"eventType":"test.event","data":{"test":true}}',
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

            const result = await trySendWebhookPayload(mockWebhookPayload)

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(200)
            expect(result.body).toBe('{"received":true}')
            expect(fetch).toHaveBeenCalledWith(
                mockWebhookPayload.url,
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': expect.any(String),
                        'X-Webhook-Signature-Algorithm': 'sha256',
                        'X-Webhook-Id': 'test-webhook-payload-id',
                    }),
                    maxRetries: 0,
                    abortRequestTimeout: WEBHOOK_PAYLOAD_TIMEOUT_IN_MS,
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

            const result = await trySendWebhookPayload(mockWebhookPayload)

            expect(result.success).toBe(false)
            expect(result.statusCode).toBe(500)
            expect(result.body).toBe('Server error')
            expect(result.error).toBe('HTTP 500: Internal Server Error')
        })

        test('should return failure for timeout', async () => {
            fetch.mockRejectedValue(new TimeoutError())

            const result = await trySendWebhookPayload(mockWebhookPayload)

            expect(result.success).toBe(false)
            expect(result.error).toContain('timeout')
        })

        test('should return failure for network error', async () => {
            fetch.mockRejectedValue(new Error('Connection refused'))

            const result = await trySendWebhookPayload(mockWebhookPayload)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Connection refused')
        })

        test('should return failure if url is missing', async () => {
            const webhookPayloadWithoutUrl = { ...mockWebhookPayload, url: null }

            const result = await trySendWebhookPayload(webhookPayloadWithoutUrl)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Missing required payload fields')
        })

        test('should return failure if payload is missing', async () => {
            const webhookPayloadWithoutPayload = { ...mockWebhookPayload, payload: null }

            const result = await trySendWebhookPayload(webhookPayloadWithoutPayload)

            expect(result.success).toBe(false)
            expect(result.error).toContain('Missing required payload fields')
        })

        test('should return failure if secret is missing', async () => {
            const webhookPayloadWithoutSecret = { ...mockWebhookPayload, secret: null }

            const result = await trySendWebhookPayload(webhookPayloadWithoutSecret)

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

            const result = await trySendWebhookPayload(mockWebhookPayload)

            expect(result.success).toBe(true)
            expect(result.body).toHaveLength(1000) // WEBHOOK_MAX_RESPONSE_LENGTH
        })

        test('should handle payload as string', async () => {
            const webhookPayloadWithStringPayload = {
                ...mockWebhookPayload,
                payload: '{"event":"test"}',
            }

            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue('OK'),
            })

            const result = await trySendWebhookPayload(webhookPayloadWithStringPayload)

            expect(result.success).toBe(true)
            expect(fetch).toHaveBeenCalledWith(
                mockWebhookPayload.url,
                expect.objectContaining({
                    body: '{"event":"test"}',
                })
            )
        })

        test('should log info on successful sending', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: jest.fn().mockResolvedValue('OK'),
            })

            await trySendWebhookPayload(mockWebhookPayload)

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    msg: 'Sending webhook payload',
                })
            )
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    msg: 'Webhook payload send result',
                    data: expect.objectContaining({
                        success: true,
                    }),
                })
            )
        })

        test('should log info on HTTP error', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: jest.fn().mockResolvedValue('Error'),
            })

            await trySendWebhookPayload(mockWebhookPayload)

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    msg: 'Webhook payload send result',
                    data: expect.objectContaining({
                        success: false,
                    }),
                })
            )
        })

        test('should log info on network error', async () => {
            fetch.mockRejectedValue(new Error('Connection refused'))

            await trySendWebhookPayload(mockWebhookPayload)

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    msg: 'Webhook payload send result',
                    data: expect.objectContaining({
                        success: false,
                    }),
                })
            )
        })
    })
})
