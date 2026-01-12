const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { queueWebhookPayload } = require('@open-condo/webhooks/utils/queueWebhookPayload')

const {
    getWebhookConfig,
    buildPaymentWebhookPayload,
} = require('@condo/domains/acquiring/utils/serverSchema/paymentWebhookHelpers')
const { WEBHOOK_EVENT_PAYMENT_STATUS_UPDATED } = require('@condo/domains/common/constants/webhooks')


const logger = getLogger()

/**
 * Task to build and send webhook payload for payment status change.
 * This task is queued from Payment.afterChange hook to minimize
 * async operations in the hook itself.
 *
 * @param {string} paymentId - ID of the payment
 */
async function sendPaymentStatusChangeWebhook (paymentId) {
    const { keystone: context } = getSchemaCtx('Payment')

    // Get the payment record using getById (direct adapter access, works in tests)
    const payment = await getById('Payment', paymentId)
    if (!payment || payment.deletedAt) {
        logger.info({ msg: 'Payment was deleted or is not available', data: { paymentId } })
        return 'payment-deleted'
    }

    // Get callback URL and secret from invoice or receipt
    const { url, secret } = await getWebhookConfig(payment)

    if (!url || !secret) {
        logger.info({ msg: 'No callback URL or secret found for payment', data: { paymentId, url } })
        return 'no-url-or-secret'
    }

    // Build the webhook payload (snapshot of current Payment state)
    const payload = await buildPaymentWebhookPayload(payment)

    // Queue the webhook for sending
    await queueWebhookPayload(context, {
        url,
        payload,
        secret,
        eventType: WEBHOOK_EVENT_PAYMENT_STATUS_UPDATED,
        modelName: 'Payment',
        itemId: payment.id,
        sender: { dv: 1, fingerprint: 'payment-webhook-task' },
    })
}

module.exports = {
    sendPaymentStatusChangeWebhook,
}
