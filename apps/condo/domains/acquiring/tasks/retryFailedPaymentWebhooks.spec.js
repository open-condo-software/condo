/**
 * @jest-environment node
 */

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}

const mockSendPaymentWebhook = {
    delay: jest.fn().mockResolvedValue(undefined),
}

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn(() => mockLogger),
}))
jest.mock('@open-condo/keystone/schema')
jest.mock('@condo/domains/acquiring/tasks/sendPaymentWebhook', () => ({
    sendPaymentWebhook: mockSendPaymentWebhook,
}))

const { find } = require('@open-condo/keystone/schema')

const {
    PAYMENT_WEBHOOK_DELIVERY_STATUS_PENDING,
} = require('@condo/domains/acquiring/constants/webhook')

const { retryFailedPaymentWebhooks } = require('./retryFailedPaymentWebhooks')


describe('retryFailedPaymentWebhooks', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockSendPaymentWebhook.delay.mockResolvedValue(undefined)
    })

    it('should log and return if no pending deliveries', async () => {
        find.mockResolvedValue([])

        await retryFailedPaymentWebhooks()

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({ msg: 'No pending webhook deliveries to retry' })
        )
        expect(mockSendPaymentWebhook.delay).not.toHaveBeenCalled()
    })

    it('should queue pending deliveries for retry', async () => {
        const mockDeliveries = [
            { id: 'delivery-1' },
            { id: 'delivery-2' },
            { id: 'delivery-3' },
        ]
        find.mockResolvedValue(mockDeliveries)

        await retryFailedPaymentWebhooks()

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Found pending webhook deliveries',
                data: expect.objectContaining({ count: 3 }),
            })
        )
        expect(mockSendPaymentWebhook.delay).toHaveBeenCalledTimes(3)
        expect(mockSendPaymentWebhook.delay).toHaveBeenCalledWith('delivery-1')
        expect(mockSendPaymentWebhook.delay).toHaveBeenCalledWith('delivery-2')
        expect(mockSendPaymentWebhook.delay).toHaveBeenCalledWith('delivery-3')
    })

    it('should query with correct filters', async () => {
        find.mockResolvedValue([])

        await retryFailedPaymentWebhooks()

        expect(find).toHaveBeenCalledWith(
            'PaymentWebhookDelivery',
            expect.objectContaining({
                status: PAYMENT_WEBHOOK_DELIVERY_STATUS_PENDING,
                deletedAt: null,
            })
        )

        // Verify time-based filters are present
        const callArgs = find.mock.calls[0][1]
        expect(callArgs).toHaveProperty('nextRetryAt_lte')
        expect(callArgs).toHaveProperty('expiresAt_gt')
    })

    it('should handle errors when queuing individual deliveries', async () => {
        const mockDeliveries = [
            { id: 'delivery-1' },
            { id: 'delivery-2' },
        ]
        find.mockResolvedValue(mockDeliveries)
        mockSendPaymentWebhook.delay
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('Queue error'))

        await retryFailedPaymentWebhooks()

        expect(mockSendPaymentWebhook.delay).toHaveBeenCalledTimes(2)
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Failed to queue webhook delivery',
                data: { deliveryId: 'delivery-2' },
            })
        )
    })
})
