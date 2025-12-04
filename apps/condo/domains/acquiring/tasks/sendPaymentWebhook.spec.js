/**
 * @jest-environment node
 */

const dayjs = require('dayjs')

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn(() => mockLogger),
}))
jest.mock('@open-condo/keystone/schema')
jest.mock('@condo/domains/acquiring/utils/serverSchema')
jest.mock('@condo/domains/acquiring/utils/serverSchema/webhookDelivery')

const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')

const {
    PAYMENT_WEBHOOK_DELIVERY_STATUS_PENDING,
    PAYMENT_WEBHOOK_DELIVERY_STATUS_SUCCESS,
    PAYMENT_WEBHOOK_DELIVERY_STATUS_FAILED,
} = require('@condo/domains/acquiring/constants/webhook')
const { PaymentWebhookDelivery } = require('@condo/domains/acquiring/utils/serverSchema')
const {
    tryDeliverWebhook,
    calculateNextRetryAt,
} = require('@condo/domains/acquiring/utils/serverSchema/webhookDelivery')

// Import after mocks are set up - use the raw function for testing
const { _sendPaymentWebhook: sendPaymentWebhook } = require('./sendPaymentWebhook')


describe('sendPaymentWebhook', () => {
    const mockKeystoneContext = {}
    const mockSchemaCtx = { keystone: mockKeystoneContext }

    beforeEach(() => {
        jest.clearAllMocks()
        getSchemaCtx.mockReturnValue(mockSchemaCtx)
        PaymentWebhookDelivery.update = jest.fn().mockResolvedValue({})
    })

    describe('sendPaymentWebhook task', () => {
        const mockDelivery = {
            id: 'delivery-uuid',
            payment: 'payment-uuid',
            status: PAYMENT_WEBHOOK_DELIVERY_STATUS_PENDING,
            attempt: 0,
            expiresAt: dayjs().add(7, 'day').toISOString(),
            nextRetryAt: dayjs().toISOString(),
            callbackUrl: 'https://example.com/webhook',
        }

        it('should skip if delivery not found', async () => {
            getById.mockReturnValue(null)

            await sendPaymentWebhook('non-existent-id')

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({ msg: 'Delivery record not found' })
            )
            expect(PaymentWebhookDelivery.update).not.toHaveBeenCalled()
        })

        it('should skip if delivery already processed', async () => {
            getById.mockReturnValue({
                ...mockDelivery,
                status: PAYMENT_WEBHOOK_DELIVERY_STATUS_SUCCESS,
            })

            await sendPaymentWebhook('delivery-uuid')

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({ msg: 'Delivery already processed' })
            )
            expect(tryDeliverWebhook).not.toHaveBeenCalled()
        })

        it('should mark as failed if expired', async () => {
            getById.mockReturnValue({
                ...mockDelivery,
                expiresAt: dayjs().subtract(1, 'day').toISOString(),
            })

            await sendPaymentWebhook('delivery-uuid')

            expect(PaymentWebhookDelivery.update).toHaveBeenCalledWith(
                mockKeystoneContext,
                'delivery-uuid',
                expect.objectContaining({
                    status: PAYMENT_WEBHOOK_DELIVERY_STATUS_FAILED,
                    lastErrorMessage: 'Delivery expired after TTL',
                })
            )
        })

        it('should mark as success on successful delivery', async () => {
            getById.mockReturnValue(mockDelivery)
            tryDeliverWebhook.mockResolvedValue({
                success: true,
                statusCode: 200,
                body: '{"received":true}',
            })

            await sendPaymentWebhook('delivery-uuid')

            expect(PaymentWebhookDelivery.update).toHaveBeenCalledWith(
                mockKeystoneContext,
                'delivery-uuid',
                expect.objectContaining({
                    status: PAYMENT_WEBHOOK_DELIVERY_STATUS_SUCCESS,
                    lastHttpStatusCode: 200,
                    lastResponseBody: '{"received":true}',
                    attempt: 1,
                })
            )
        })

        it('should schedule retry on failed delivery', async () => {
            const nextRetryAt = dayjs().add(1, 'minute').toISOString()
            getById.mockReturnValue(mockDelivery)
            tryDeliverWebhook.mockResolvedValue({
                success: false,
                statusCode: 500,
                body: 'Server error',
                error: 'HTTP 500: Internal Server Error',
            })
            calculateNextRetryAt.mockReturnValue(nextRetryAt)

            await sendPaymentWebhook('delivery-uuid')

            expect(PaymentWebhookDelivery.update).toHaveBeenCalledWith(
                mockKeystoneContext,
                'delivery-uuid',
                expect.objectContaining({
                    status: PAYMENT_WEBHOOK_DELIVERY_STATUS_PENDING,
                    lastHttpStatusCode: 500,
                    lastResponseBody: 'Server error',
                    lastErrorMessage: 'HTTP 500: Internal Server Error',
                    nextRetryAt,
                    attempt: 1,
                })
            )
        })

        it('should mark as permanently failed if next retry after expiration', async () => {
            const expiresAt = dayjs().add(1, 'minute').toISOString()
            const nextRetryAt = dayjs().add(1, 'hour').toISOString()

            getById.mockReturnValue({
                ...mockDelivery,
                expiresAt,
            })
            tryDeliverWebhook.mockResolvedValue({
                success: false,
                error: 'Connection refused',
            })
            calculateNextRetryAt.mockReturnValue(nextRetryAt)

            await sendPaymentWebhook('delivery-uuid')

            expect(PaymentWebhookDelivery.update).toHaveBeenCalledWith(
                mockKeystoneContext,
                'delivery-uuid',
                expect.objectContaining({
                    status: PAYMENT_WEBHOOK_DELIVERY_STATUS_FAILED,
                    lastErrorMessage: 'Connection refused',
                    attempt: 1,
                })
            )
        })
    })
})
