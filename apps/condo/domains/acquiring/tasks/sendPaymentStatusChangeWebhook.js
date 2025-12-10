const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { sendWebhookPayload } = require('@open-condo/webhooks/utils/sendWebhookPayload')

const {
    getWebhookSecret,
    getWebhookCallbackUrl,
    buildPaymentWebhookPayload,
} = require('@condo/domains/acquiring/utils/serverSchema/paymentWebhookHelpers')

/**
 * Task to build and send webhook payload for payment status change.
 * This task is queued from Payment.afterChange hook to minimize
 * async operations in the hook itself.
 *
 * @param {string} paymentId - ID of the payment
 */
async function sendPaymentStatusChangeWebhook (paymentId) {
    const { keystone: context } = await getSchemaCtx('Payment')

    // Get the payment record using getById (direct adapter access, works in tests)
    const payment = await getById('Payment', paymentId)
    if (!payment || payment.deletedAt) {
        return
    }

    // Get callback URL and secret from invoice or receipt
    const url = await getWebhookCallbackUrl(payment)
    const secret = await getWebhookSecret(payment)

    if (!url || !secret) {
        return
    }

    // Build the webhook payload (snapshot of current Payment state)
    const payload = await buildPaymentWebhookPayload(payment)

    // Send the webhook
    await sendWebhookPayload(context, {
        url,
        payload,
        secret,
        eventType: 'payment.status.changed',
        modelName: 'Payment',
        itemId: payment.id,
        sender: { dv: 1, fingerprint: 'payment-webhook-task' },
    })
}

module.exports = {
    sendPaymentStatusChangeWebhook,
}
