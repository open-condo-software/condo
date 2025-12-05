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
    WebhookDelivery: {
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
const { _sendWebhook } = require('@condo/domains/common/tasks/sendWebhook')
const { WebhookDelivery } = require('@condo/domains/common/utils/serverSchema')
const { tryDeliverWebhook, calculateNextRetryAt } = require('@condo/domains/common/utils/serverSchema/webhookDelivery')


describe('sendWebhook task', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const createMockDelivery = (overrides = {}) => ({
        id: 'test-delivery-id',
        status: WEBHOOK_DELIVERY_STATUS_PENDING,
        attempt: 0,
        expiresAt: dayjs().add(7, 'day').toISOString(),
        nextRetryAt: dayjs().toISOString(),
        url: 'https://example.com/webhook',
        payload: { event: 'test' },
        secret: 'test-secret',
        ...overrides,
    })

    test('should skip if delivery not found', async () => {
        getById.mockResolvedValue(null)

        await _sendWebhook('non-existent-id')

        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Delivery record not found',
            })
        )
        expect(WebhookDelivery.update).not.toHaveBeenCalled()
    })

    test('should skip if delivery already processed', async () => {
        getById.mockResolvedValue(createMockDelivery({
            status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
        }))

        await _sendWebhook('test-delivery-id')

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Delivery already processed',
            })
        )
        expect(WebhookDelivery.update).not.toHaveBeenCalled()
    })

    test('should mark as failed if expired', async () => {
        getById.mockResolvedValue(createMockDelivery({
            expiresAt: dayjs().subtract(1, 'hour').toISOString(),
        }))

        await _sendWebhook('test-delivery-id')

        expect(WebhookDelivery.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-delivery-id',
            expect.objectContaining({
                status: WEBHOOK_DELIVERY_STATUS_FAILED,
                lastErrorMessage: 'Delivery expired after TTL',
            })
        )
    })

    test('should mark as success on successful delivery', async () => {
        const delivery = createMockDelivery()
        getById.mockResolvedValue(delivery)
        tryDeliverWebhook.mockResolvedValue({
            success: true,
            statusCode: 200,
            body: '{"received":true}',
        })

        await _sendWebhook('test-delivery-id')

        expect(WebhookDelivery.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-delivery-id',
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
        const delivery = createMockDelivery()
        const nextRetryAt = dayjs().add(1, 'minute').toISOString()

        getById.mockResolvedValue(delivery)
        tryDeliverWebhook.mockResolvedValue({
            success: false,
            statusCode: 500,
            body: 'Server error',
            error: 'HTTP 500: Internal Server Error',
        })
        calculateNextRetryAt.mockReturnValue(nextRetryAt)

        await _sendWebhook('test-delivery-id')

        expect(WebhookDelivery.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-delivery-id',
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
                msg: 'Webhook delivery failed, scheduled retry',
            })
        )
    })

    test('should mark as failed if next retry would be after expiration', async () => {
        const expiresAt = dayjs().add(30, 'second').toISOString()
        const delivery = createMockDelivery({ expiresAt })
        const nextRetryAt = dayjs().add(1, 'minute').toISOString() // After expiration

        getById.mockResolvedValue(delivery)
        tryDeliverWebhook.mockResolvedValue({
            success: false,
            error: 'Connection refused',
        })
        calculateNextRetryAt.mockReturnValue(nextRetryAt)

        await _sendWebhook('test-delivery-id')

        expect(WebhookDelivery.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-delivery-id',
            expect.objectContaining({
                status: WEBHOOK_DELIVERY_STATUS_FAILED,
                lastErrorMessage: 'Connection refused',
                attempt: 1,
            })
        )
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Webhook delivery permanently failed (next retry after expiration)',
            })
        )
    })

    test('should increment attempt counter', async () => {
        const delivery = createMockDelivery({ attempt: 3 })
        getById.mockResolvedValue(delivery)
        tryDeliverWebhook.mockResolvedValue({
            success: true,
            statusCode: 200,
            body: 'OK',
        })

        await _sendWebhook('test-delivery-id')

        expect(WebhookDelivery.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-delivery-id',
            expect.objectContaining({
                attempt: 4,
            })
        )
    })

    test('should handle null statusCode and body on network error', async () => {
        const delivery = createMockDelivery()
        const nextRetryAt = dayjs().add(1, 'minute').toISOString()

        getById.mockResolvedValue(delivery)
        tryDeliverWebhook.mockResolvedValue({
            success: false,
            error: 'Connection refused',
            // No statusCode or body
        })
        calculateNextRetryAt.mockReturnValue(nextRetryAt)

        await _sendWebhook('test-delivery-id')

        expect(WebhookDelivery.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-delivery-id',
            expect.objectContaining({
                lastHttpStatusCode: null,
                lastResponseBody: null,
                lastErrorMessage: 'Connection refused',
            })
        )
    })

    test('should clear lastErrorMessage on success', async () => {
        const delivery = createMockDelivery({
            lastErrorMessage: 'Previous error',
        })
        getById.mockResolvedValue(delivery)
        tryDeliverWebhook.mockResolvedValue({
            success: true,
            statusCode: 200,
            body: 'OK',
        })

        await _sendWebhook('test-delivery-id')

        expect(WebhookDelivery.update).toHaveBeenCalledWith(
            mockContext.keystone,
            'test-delivery-id',
            expect.objectContaining({
                lastErrorMessage: null,
            })
        )
    })
})
