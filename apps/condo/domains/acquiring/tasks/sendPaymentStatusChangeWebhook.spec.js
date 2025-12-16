/**
 * @jest-environment node
 */
const { faker } = require('@faker-js/faker')

jest.mock('@open-condo/keystone/schema', () => ({
    getSchemaCtx: jest.fn().mockReturnValue({ keystone: {} }),
    getById: jest.fn(),
}))
jest.mock('@open-condo/webhooks/utils/sendWebhookPayload')
jest.mock('@condo/domains/acquiring/utils/serverSchema/paymentWebhookHelpers')

const { getById } = require('@open-condo/keystone/schema')
const { sendWebhookPayload } = require('@open-condo/webhooks/utils/sendWebhookPayload')

const {
    getWebhookSecret,
    getWebhookCallbackUrl,
    buildPaymentWebhookPayload,
} = require('@condo/domains/acquiring/utils/serverSchema/paymentWebhookHelpers')

const { sendPaymentStatusChangeWebhook } = require('./sendPaymentStatusChangeWebhook')

describe('sendPaymentStatusChangeWebhook', () => {
    const mockPaymentId = faker.datatype.uuid()
    const mockUrl = 'https://example.com/webhook'
    const mockSecret = 'test-secret-key'
    const mockPayload = { eventType: 'payment.status.changed', data: {} }
    const mockPayment = { id: mockPaymentId, invoice: faker.datatype.uuid() }

    beforeEach(() => {
        jest.clearAllMocks()
        getById.mockResolvedValue(mockPayment)
        getWebhookCallbackUrl.mockResolvedValue(mockUrl)
        getWebhookSecret.mockResolvedValue(mockSecret)
        buildPaymentWebhookPayload.mockResolvedValue(mockPayload)
        sendWebhookPayload.mockResolvedValue(undefined)
    })

    test('should send webhook when payment has URL and secret', async () => {
        await sendPaymentStatusChangeWebhook(mockPaymentId)

        expect(getById).toHaveBeenCalledWith('Payment', mockPaymentId)
        expect(getWebhookCallbackUrl).toHaveBeenCalledWith(mockPayment)
        expect(getWebhookSecret).toHaveBeenCalledWith(mockPayment)
        expect(buildPaymentWebhookPayload).toHaveBeenCalledWith(mockPayment)
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
        getById.mockResolvedValue(null)

        await sendPaymentStatusChangeWebhook(mockPaymentId)

        expect(sendWebhookPayload).not.toHaveBeenCalled()
    })

    test('should not send webhook when URL is missing', async () => {
        getWebhookCallbackUrl.mockResolvedValue(null)

        await sendPaymentStatusChangeWebhook(mockPaymentId)

        expect(sendWebhookPayload).not.toHaveBeenCalled()
    })

    test('should not send webhook when secret is missing', async () => {
        getWebhookSecret.mockResolvedValue(null)

        await sendPaymentStatusChangeWebhook(mockPaymentId)

        expect(sendWebhookPayload).not.toHaveBeenCalled()
    })
})
