/**
 * @jest-environment node
 */
const { faker } = require('@faker-js/faker')

jest.mock('@open-condo/keystone/schema', () => ({
    getSchemaCtx: jest.fn().mockReturnValue({ keystone: {} }),
    getById: jest.fn(),
}))
jest.mock('@open-condo/webhooks/utils/queueWebhookPayload')
jest.mock('@condo/domains/acquiring/utils/serverSchema/paymentWebhookHelpers')

const { getById } = require('@open-condo/keystone/schema')
const { queueWebhookPayload } = require('@open-condo/webhooks/utils/queueWebhookPayload')

const {
    getWebhookConfig,
    buildPaymentWebhookPayload,
} = require('@condo/domains/acquiring/utils/serverSchema/paymentWebhookHelpers')
const { WEBHOOK_EVENT_PAYMENT_STATUS_UPDATED } = require('@condo/domains/common/constants/webhooks')

const { sendPaymentStatusChangeWebhook } = require('./sendPaymentStatusChangeWebhook')

describe('sendPaymentStatusChangeWebhook', () => {
    const mockPaymentId = faker.datatype.uuid()
    const mockUrl = 'https://example.com/webhook'
    const mockSecret = 'test-secret-key'
    const mockPayload = { eventType: WEBHOOK_EVENT_PAYMENT_STATUS_UPDATED, data: {} }
    const mockPayment = { id: mockPaymentId, invoice: faker.datatype.uuid() }

    beforeEach(() => {
        jest.clearAllMocks()
        getById.mockResolvedValue(mockPayment)
        getWebhookConfig.mockResolvedValue({ url: mockUrl, secret: mockSecret })
        buildPaymentWebhookPayload.mockResolvedValue(mockPayload)
        queueWebhookPayload.mockResolvedValue(undefined)
    })

    test('should send webhook when payment has URL and secret', async () => {
        await sendPaymentStatusChangeWebhook(mockPaymentId)

        expect(getById).toHaveBeenCalledWith('Payment', mockPaymentId)
        expect(getWebhookConfig).toHaveBeenCalledWith(mockPayment)
        expect(buildPaymentWebhookPayload).toHaveBeenCalledWith(mockPayment)
        expect(queueWebhookPayload).toHaveBeenCalledWith(
            expect.anything(),
            {
                url: mockUrl,
                payload: mockPayload,
                secret: mockSecret,
                eventType: WEBHOOK_EVENT_PAYMENT_STATUS_UPDATED,
                modelName: 'Payment',
                itemId: mockPaymentId,
                sender: { dv: 1, fingerprint: 'payment-webhook-task' },
            }
        )
    })

    test('should not send webhook when payment not found', async () => {
        getById.mockResolvedValue(null)

        await sendPaymentStatusChangeWebhook(mockPaymentId)

        expect(queueWebhookPayload).not.toHaveBeenCalled()
    })

    test('should not send webhook when URL is missing', async () => {
        getWebhookConfig.mockResolvedValue({ url: null, secret: mockSecret })

        await sendPaymentStatusChangeWebhook(mockPaymentId)

        expect(queueWebhookPayload).not.toHaveBeenCalled()
    })

    test('should not send webhook when secret is missing', async () => {
        getWebhookConfig.mockResolvedValue({ url: mockUrl, secret: null })

        await sendPaymentStatusChangeWebhook(mockPaymentId)

        expect(queueWebhookPayload).not.toHaveBeenCalled()
    })
})
