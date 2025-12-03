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
    find: jest.fn(),
}))

jest.mock('@open-condo/keystone/tasks', () => ({
    createCronTask: jest.fn((name, cron, fn) => {
        fn.delay = jest.fn()
        return fn
    }),
}))

const mockSendInvoiceWebhookDelay = jest.fn()
jest.mock('@condo/domains/marketplace/tasks/sendInvoiceWebhook', () => ({
    sendInvoiceWebhook: {
        delay: mockSendInvoiceWebhookDelay,
    },
}))

const { find } = require('@open-condo/keystone/schema')

const {
    INVOICE_WEBHOOK_DELIVERY_STATUS_PENDING,
} = require('@condo/domains/marketplace/constants')

// Import after mocks
const { retryFailedInvoiceWebhooks } = require('./retryFailedInvoiceWebhooks')

describe('retryFailedInvoiceWebhooks cron task', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should do nothing when no pending deliveries', async () => {
        find.mockResolvedValue([])

        await retryFailedInvoiceWebhooks()

        expect(mockSendInvoiceWebhookDelay).not.toHaveBeenCalled()
    })

    it('should query for pending deliveries with correct filters', async () => {
        find.mockResolvedValue([])

        await retryFailedInvoiceWebhooks()

        expect(find).toHaveBeenCalledWith(
            'InvoiceWebhookDelivery',
            expect.objectContaining({
                status: INVOICE_WEBHOOK_DELIVERY_STATUS_PENDING,
                deletedAt: null,
            })
        )

        // Check that nextRetryAt_lte and expiresAt_gt are present
        const callArgs = find.mock.calls[0][1]
        expect(callArgs.nextRetryAt_lte).toBeDefined()
        expect(callArgs.expiresAt_gt).toBeDefined()
    })

    it('should queue each pending delivery for processing', async () => {
        const pendingDeliveries = [
            { id: 'delivery-1' },
            { id: 'delivery-2' },
            { id: 'delivery-3' },
        ]
        find.mockResolvedValue(pendingDeliveries)

        await retryFailedInvoiceWebhooks()

        expect(mockSendInvoiceWebhookDelay).toHaveBeenCalledTimes(3)
        expect(mockSendInvoiceWebhookDelay).toHaveBeenCalledWith('delivery-1')
        expect(mockSendInvoiceWebhookDelay).toHaveBeenCalledWith('delivery-2')
        expect(mockSendInvoiceWebhookDelay).toHaveBeenCalledWith('delivery-3')
    })

    it('should continue processing other deliveries if one fails to queue', async () => {
        const pendingDeliveries = [
            { id: 'delivery-1' },
            { id: 'delivery-2' },
            { id: 'delivery-3' },
        ]
        find.mockResolvedValue(pendingDeliveries)
        mockSendInvoiceWebhookDelay
            .mockResolvedValueOnce()
            .mockRejectedValueOnce(new Error('Queue error'))
            .mockResolvedValueOnce()

        await retryFailedInvoiceWebhooks()

        expect(mockSendInvoiceWebhookDelay).toHaveBeenCalledTimes(3)
    })

    it('should filter deliveries that are due for retry', async () => {
        find.mockResolvedValue([])

        const beforeCall = dayjs()
        await retryFailedInvoiceWebhooks()
        const afterCall = dayjs()

        const callArgs = find.mock.calls[0][1]
        const nextRetryLte = dayjs(callArgs.nextRetryAt_lte)
        const expiresGt = dayjs(callArgs.expiresAt_gt)

        // nextRetryAt_lte should be around "now"
        expect(nextRetryLte.isAfter(beforeCall.subtract(1, 'second'))).toBe(true)
        expect(nextRetryLte.isBefore(afterCall.add(1, 'second'))).toBe(true)

        // expiresAt_gt should also be around "now"
        expect(expiresGt.isAfter(beforeCall.subtract(1, 'second'))).toBe(true)
        expect(expiresGt.isBefore(afterCall.add(1, 'second'))).toBe(true)
    })
})
