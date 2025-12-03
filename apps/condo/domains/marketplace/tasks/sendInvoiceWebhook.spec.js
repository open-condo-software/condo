/**
 * @jest-environment node
 */

const dayjs = require('dayjs')

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: () => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    }),
}))

jest.mock('@open-condo/keystone/schema', () => ({
    getSchemaCtx: jest.fn(() => ({ keystone: {} })),
    getById: jest.fn(),
}))

jest.mock('@open-condo/keystone/tasks', () => ({
    createTask: jest.fn((name, fn) => {
        fn.delay = jest.fn()
        return fn
    }),
}))

jest.mock('@condo/domains/marketplace/utils/serverSchema', () => ({
    InvoiceWebhookDelivery: {
        update: jest.fn(),
    },
}))

jest.mock('@condo/domains/marketplace/utils/serverSchema/webhookDelivery', () => ({
    tryDeliverWebhook: jest.fn(),
    calculateNextRetryAt: jest.fn(),
}))

const { getById } = require('@open-condo/keystone/schema')

const {
    INVOICE_WEBHOOK_DELIVERY_STATUS_PENDING,
    INVOICE_WEBHOOK_DELIVERY_STATUS_SUCCESS,
    INVOICE_WEBHOOK_DELIVERY_STATUS_FAILED,
} = require('@condo/domains/marketplace/constants')
const { InvoiceWebhookDelivery } = require('@condo/domains/marketplace/utils/serverSchema')
const {
    tryDeliverWebhook,
    calculateNextRetryAt,
} = require('@condo/domains/marketplace/utils/serverSchema/webhookDelivery')

// Import after mocks
const { sendInvoiceWebhook } = require('./sendInvoiceWebhook')

describe('sendInvoiceWebhook task', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const createMockDelivery = (overrides = {}) => ({
        id: 'delivery-123',
        invoice: 'invoice-456',
        callbackUrl: 'https://example.com/webhook',
        status: INVOICE_WEBHOOK_DELIVERY_STATUS_PENDING,
        attempt: 0,
        expiresAt: dayjs().add(7, 'day').toISOString(),
        nextRetryAt: dayjs().toISOString(),
        ...overrides,
    })

    describe('delivery not found', () => {
        it('should return early if delivery record not found', async () => {
            getById.mockReturnValue(null)

            await sendInvoiceWebhook('non-existent-id')

            expect(InvoiceWebhookDelivery.update).not.toHaveBeenCalled()
            expect(tryDeliverWebhook).not.toHaveBeenCalled()
        })
    })

    describe('already processed', () => {
        it('should skip if status is success', async () => {
            getById.mockReturnValue(createMockDelivery({
                status: INVOICE_WEBHOOK_DELIVERY_STATUS_SUCCESS,
            }))

            await sendInvoiceWebhook('delivery-123')

            expect(tryDeliverWebhook).not.toHaveBeenCalled()
        })

        it('should skip if status is failed', async () => {
            getById.mockReturnValue(createMockDelivery({
                status: INVOICE_WEBHOOK_DELIVERY_STATUS_FAILED,
            }))

            await sendInvoiceWebhook('delivery-123')

            expect(tryDeliverWebhook).not.toHaveBeenCalled()
        })
    })

    describe('expired delivery', () => {
        it('should mark as failed if expired', async () => {
            getById.mockReturnValue(createMockDelivery({
                expiresAt: dayjs().subtract(1, 'hour').toISOString(),
            }))

            await sendInvoiceWebhook('delivery-123')

            expect(InvoiceWebhookDelivery.update).toHaveBeenCalledWith(
                expect.anything(),
                'delivery-123',
                expect.objectContaining({
                    status: INVOICE_WEBHOOK_DELIVERY_STATUS_FAILED,
                    errorMessage: 'Delivery expired after TTL',
                })
            )
            expect(tryDeliverWebhook).not.toHaveBeenCalled()
        })
    })

    describe('successful delivery', () => {
        it('should mark as success on successful delivery', async () => {
            const delivery = createMockDelivery()
            getById.mockReturnValue(delivery)
            tryDeliverWebhook.mockResolvedValue({
                success: true,
                statusCode: 200,
                body: '{"ok": true}',
            })

            await sendInvoiceWebhook('delivery-123')

            expect(tryDeliverWebhook).toHaveBeenCalledWith(delivery)
            expect(InvoiceWebhookDelivery.update).toHaveBeenCalledWith(
                expect.anything(),
                'delivery-123',
                expect.objectContaining({
                    status: INVOICE_WEBHOOK_DELIVERY_STATUS_SUCCESS,
                    httpStatusCode: 200,
                    responseBody: '{"ok": true}',
                    attempt: 1,
                    errorMessage: null,
                })
            )
        })
    })

    describe('failed delivery with retry', () => {
        it('should schedule retry on failure', async () => {
            const delivery = createMockDelivery({ attempt: 0 })
            const nextRetry = dayjs().add(1, 'minute').toISOString()

            getById.mockReturnValue(delivery)
            tryDeliverWebhook.mockResolvedValue({
                success: false,
                statusCode: 500,
                body: 'Server error',
                error: 'HTTP 500: Internal Server Error',
            })
            calculateNextRetryAt.mockReturnValue(nextRetry)

            await sendInvoiceWebhook('delivery-123')

            expect(InvoiceWebhookDelivery.update).toHaveBeenCalledWith(
                expect.anything(),
                'delivery-123',
                expect.objectContaining({
                    status: INVOICE_WEBHOOK_DELIVERY_STATUS_PENDING,
                    httpStatusCode: 500,
                    responseBody: 'Server error',
                    errorMessage: 'HTTP 500: Internal Server Error',
                    nextRetryAt: nextRetry,
                    attempt: 1,
                })
            )
        })

        it('should mark as failed if next retry is after expiration', async () => {
            const expiresAt = dayjs().add(1, 'hour').toISOString()
            const delivery = createMockDelivery({
                attempt: 5,
                expiresAt,
            })
            const nextRetry = dayjs().add(2, 'hour').toISOString() // After expiration

            getById.mockReturnValue(delivery)
            tryDeliverWebhook.mockResolvedValue({
                success: false,
                statusCode: 503,
                error: 'Service Unavailable',
            })
            calculateNextRetryAt.mockReturnValue(nextRetry)

            await sendInvoiceWebhook('delivery-123')

            expect(InvoiceWebhookDelivery.update).toHaveBeenCalledWith(
                expect.anything(),
                'delivery-123',
                expect.objectContaining({
                    status: INVOICE_WEBHOOK_DELIVERY_STATUS_FAILED,
                    attempt: 6,
                })
            )
        })
    })

    describe('network errors', () => {
        it('should handle network errors and schedule retry', async () => {
            const delivery = createMockDelivery()
            const nextRetry = dayjs().add(1, 'minute').toISOString()

            getById.mockReturnValue(delivery)
            tryDeliverWebhook.mockResolvedValue({
                success: false,
                error: 'ECONNREFUSED',
            })
            calculateNextRetryAt.mockReturnValue(nextRetry)

            await sendInvoiceWebhook('delivery-123')

            expect(InvoiceWebhookDelivery.update).toHaveBeenCalledWith(
                expect.anything(),
                'delivery-123',
                expect.objectContaining({
                    status: INVOICE_WEBHOOK_DELIVERY_STATUS_PENDING,
                    errorMessage: 'ECONNREFUSED',
                    httpStatusCode: null,
                    responseBody: null,
                })
            )
        })
    })
})
