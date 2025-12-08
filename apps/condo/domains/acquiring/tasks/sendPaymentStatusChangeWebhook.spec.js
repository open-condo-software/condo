/**
 * @jest-environment node
 */
const { faker } = require('@faker-js/faker')

jest.mock('@open-condo/keystone/schema', () => ({
    getSchemaCtx: jest.fn().mockResolvedValue({ keystone: {} }),
}))
jest.mock('@open-condo/webhooks/utils/sendWebhookPayload')
jest.mock('@condo/domains/acquiring/utils/serverSchema')
jest.mock('@condo/domains/acquiring/utils/serverSchema/paymentWebhookHelpers')

const { sendWebhookPayload } = require('@open-condo/webhooks/utils/sendWebhookPayload')

const { Payment } = require('@condo/domains/acquiring/utils/serverSchema')
const {
    getWebhookSecret,
    getWebhookCallbackUrl,
    buildPaymentWebhookPayload,
} = require('@condo/domains/acquiring/utils/serverSchema/paymentWebhookHelpers')

const { sendPaymentStatusChangeWebhook } = require('./sendPaymentStatusChangeWebhook')

describe('sendPaymentStatusChangeWebhook', () => {
    const mockPaymentId = faker.datatype.uuid()
    const mockPreviousStatus = 'CREATED'
    const mockNewStatus = 'PROCESSING'
    const mockUrl = 'https://example.com/webhook'
    const mockSecret = 'test-secret-key'
    const mockPayload = { event: 'payment.status.changed', data: {} }
    const mockPayment = { id: mockPaymentId, invoice: faker.datatype.uuid() }

    beforeEach(() => {
        jest.clearAllMocks()
        Payment.getOne = jest.fn().mockResolvedValue(mockPayment)
        getWebhookCallbackUrl.mockResolvedValue(mockUrl)
        getWebhookSecret.mockResolvedValue(mockSecret)
        buildPaymentWebhookPayload.mockResolvedValue(mockPayload)
        sendWebhookPayload.mockResolvedValue(undefined)
    })

    test('should send webhook when payment has URL and secret', async () => {
        await sendPaymentStatusChangeWebhook(mockPaymentId, mockPreviousStatus, mockNewStatus)

        expect(Payment.getOne).toHaveBeenCalledWith(
            expect.anything(),
            { id: mockPaymentId, deletedAt: null }
        )
        expect(getWebhookCallbackUrl).toHaveBeenCalledWith(mockPayment)
        expect(getWebhookSecret).toHaveBeenCalledWith(mockPayment)
        expect(buildPaymentWebhookPayload).toHaveBeenCalledWith(mockPayment, mockPreviousStatus, mockNewStatus)
        expect(sendWebhookPayload).toHaveBeenCalledWith(
            expect.anything(),
            {
                url: mockUrl,
                payload: mockPayload,
                secret: mockSecret,
                eventType: 'payment.status.changed',
                modelName: 'Payment',
                itemId: mockPaymentId,
                sender: { dv: 1, fingerprint: 'payment-webhook-task' },
            }
        )
    })

    test('should not send webhook when payment not found', async () => {
        Payment.getOne.mockResolvedValue(null)

        await sendPaymentStatusChangeWebhook(mockPaymentId, mockPreviousStatus, mockNewStatus)

        expect(sendWebhookPayload).not.toHaveBeenCalled()
    })

    test('should not send webhook when URL is missing', async () => {
        getWebhookCallbackUrl.mockResolvedValue(null)

        await sendPaymentStatusChangeWebhook(mockPaymentId, mockPreviousStatus, mockNewStatus)

        expect(sendWebhookPayload).not.toHaveBeenCalled()
    })

    test('should not send webhook when secret is missing', async () => {
        getWebhookSecret.mockResolvedValue(null)

        await sendPaymentStatusChangeWebhook(mockPaymentId, mockPreviousStatus, mockNewStatus)

        expect(sendWebhookPayload).not.toHaveBeenCalled()
    })
})
