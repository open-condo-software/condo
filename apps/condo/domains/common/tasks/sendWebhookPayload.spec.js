const dayjs = require('dayjs')

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}

const mockContext = { keystone: 'mock-context' }

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn(() => mockLogger),
}))

jest.mock('@open-condo/keystone/schema', () => ({
    getSchemaCtx: jest.fn(() => mockContext),
    getById: jest.fn(),
}))

jest.mock('@condo/domains/common/utils/serverSchema', () => ({
    WebhookPayload: {
        update: jest.fn(),
    },
}))

jest.mock('@condo/domains/common/utils/serverSchema/webhookDelivery', () => ({
    tryDeliverWebhook: jest.fn(),
    calculateNextRetryAt: jest.fn(),
}))

const { getById } = require('@open-condo/keystone/schema')

const {
    WEBHOOK_DELIVERY_STATUS_PENDING,
    WEBHOOK_DELIVERY_STATUS_SUCCESS,
    WEBHOOK_DELIVERY_STATUS_FAILED,
} = require('@condo/domains/common/constants/webhook')
const { _sendWebhookPayload } = require('@condo/domains/common/tasks/sendWebhookPayload')
const { WebhookPayload } = require('@condo/domains/common/utils/serverSchema')
const { tryDeliverWebhook, calculateNextRetryAt } = require('@condo/domains/common/utils/serverSchema/webhookDelivery')


describe('sendWebhookPayload task', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const createMockPayload = (overrides = {}) => ({
        id: 'test-payload-id',
        status: WEBHOOK_DELIVERY_STATUS_PENDING,
        attempt: 0,
        expiresAt: dayjs().add(7, 'day').toISOString(),
        nextRetryAt: dayjs().toISOString(),
        url: 'https://example.com/webhook',
        payload: { event: 'test' },
        secret: 'test-secret',
        ...overrides,
    })

    test('should skip if payload not found', async () => {
        getById.mockResolvedValue(null)

        await _sendWebhookPayload('non-existent-id')

        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Payload record not found',
            })
        )
        expect(WebhookPayload.update).not.toHaveBeenCalled()
    })

    test('should skip if payload already processed', async () => {
        getById.mockResolvedValue(createMockPayload({
            status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
        }))

        await _sendWebhookPayload('test-payload-id')

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Payload already processed',
            })
        )
        expect(WebhookPayload.update).not.toHaveBeenCalled()
    })

    test('should mark as failed if expired', async () => {
        getById.mockResolvedValue(createMockPayload({
            expiresAt: dayjs().subtract(1, 'hour').toISOString(),
        }))

        await _sendWebhookPayload('test-payload-id')

        expect(WebhookPayload.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-payload-id',
            expect.objectContaining({
                status: WEBHOOK_DELIVERY_STATUS_FAILED,
                lastErrorMessage: 'Payload expired after TTL',
            })
        )
    })

    test('should mark as success on successful delivery', async () => {
        const payload = createMockPayload()
        getById.mockResolvedValue(payload)
        tryDeliverWebhook.mockResolvedValue({
            success: true,
            statusCode: 200,
            body: '{"received":true}',
        })

        await _sendWebhookPayload('test-payload-id')

        expect(WebhookPayload.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-payload-id',
            expect.objectContaining({
                status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
                lastHttpStatusCode: 200,
                lastResponseBody: '{"received":true}',
                attempt: 1,
            })
        )
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Webhook delivered successfully',
            })
        )
    })

    test('should schedule retry on failure if not expired', async () => {
        const payload = createMockPayload()
        const nextRetryAt = dayjs().add(1, 'minute').toISOString()

        getById.mockResolvedValue(payload)
        tryDeliverWebhook.mockResolvedValue({
            success: false,
            statusCode: 500,
            body: 'Server error',
            error: 'HTTP 500: Internal Server Error',
        })
        calculateNextRetryAt.mockReturnValue(nextRetryAt)

        await _sendWebhookPayload('test-payload-id')

        expect(WebhookPayload.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-payload-id',
            expect.objectContaining({
                status: WEBHOOK_DELIVERY_STATUS_PENDING,
                lastHttpStatusCode: 500,
                lastResponseBody: 'Server error',
                lastErrorMessage: 'HTTP 500: Internal Server Error',
                nextRetryAt,
                attempt: 1,
            })
        )
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Webhook payload failed, scheduled retry',
            })
        )
    })

    test('should mark as failed if next retry would be after expiration', async () => {
        const expiresAt = dayjs().add(30, 'second').toISOString()
        const payload = createMockPayload({ expiresAt })
        const nextRetryAt = dayjs().add(1, 'minute').toISOString() // After expiration

        getById.mockResolvedValue(payload)
        tryDeliverWebhook.mockResolvedValue({
            success: false,
            error: 'Connection refused',
        })
        calculateNextRetryAt.mockReturnValue(nextRetryAt)

        await _sendWebhookPayload('test-payload-id')

        expect(WebhookPayload.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-payload-id',
            expect.objectContaining({
                status: WEBHOOK_DELIVERY_STATUS_FAILED,
                lastErrorMessage: 'Connection refused',
                attempt: 1,
            })
        )
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Webhook payload permanently failed (next retry after expiration)',
            })
        )
    })

    test('should increment attempt counter', async () => {
        const payload = createMockPayload({ attempt: 3 })
        getById.mockResolvedValue(payload)
        tryDeliverWebhook.mockResolvedValue({
            success: true,
            statusCode: 200,
            body: 'OK',
        })

        await _sendWebhookPayload('test-payload-id')

        expect(WebhookPayload.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-payload-id',
            expect.objectContaining({
                attempt: 4,
            })
        )
    })

    test('should handle null statusCode and body on network error', async () => {
        const payload = createMockPayload()
        const nextRetryAt = dayjs().add(1, 'minute').toISOString()

        getById.mockResolvedValue(payload)
        tryDeliverWebhook.mockResolvedValue({
            success: false,
            error: 'Connection refused',
            // No statusCode or body
        })
        calculateNextRetryAt.mockReturnValue(nextRetryAt)

        await _sendWebhookPayload('test-payload-id')

        expect(WebhookPayload.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-payload-id',
            expect.objectContaining({
                lastHttpStatusCode: null,
                lastResponseBody: null,
                lastErrorMessage: 'Connection refused',
            })
        )
    })

    test('should clear lastErrorMessage on success', async () => {
        const payload = createMockPayload({
            lastErrorMessage: 'Previous error',
        })
        getById.mockResolvedValue(payload)
        tryDeliverWebhook.mockResolvedValue({
            success: true,
            statusCode: 200,
            body: 'OK',
        })

        await _sendWebhookPayload('test-payload-id')

        expect(WebhookPayload.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-payload-id',
            expect.objectContaining({
                lastErrorMessage: null,
            })
        )
    })
})
