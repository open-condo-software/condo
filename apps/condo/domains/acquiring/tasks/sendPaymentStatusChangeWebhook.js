const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { sendWebhookPayload } = require('@open-condo/webhooks/utils/sendWebhookPayload')

const { Payment } = require('@condo/domains/acquiring/utils/serverSchema')
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
 * @param {string} previousStatus - Payment status before the change
 * @param {string} newStatus - Payment status after the change
 */
async function sendPaymentStatusChangeWebhook (paymentId, previousStatus, newStatus) {
    const { keystone: context } = await getSchemaCtx('Payment')

    // Get the payment record
    const payment = await Payment.getOne(context, { id: paymentId, deletedAt: null })
    if (!payment) {
        return
    }

    // Get callback URL and secret from invoice or receipt
    const url = await getWebhookCallbackUrl(payment)
    const secret = await getWebhookSecret(payment)

    if (!url || !secret) {
        return
    }

    // Build the webhook payload
    const payload = await buildPaymentWebhookPayload(payment, previousStatus, newStatus)

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
