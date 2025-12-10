const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')

const { WEBHOOK_PAYLOAD_TTL_DAYS } = require('../constants')
const { WebhookPayload } = require('../schema/utils/serverSchema')
const { getWebhookTasks } = require('../tasks')

const logger = getLogger('sendWebhookPayload')

/**
 * Creates a WebhookPayload record and queues it for delivery.
 * This is a convenience function that handles both creating the payload record
 * and scheduling the delivery task.
 *
 * @param {Object} context - Keystone context (will be sudo'd internally)
 * @param {Object} options - Webhook payload options
 * @param {string} options.url - Target URL for webhook delivery
 * @param {Object|string} options.payload - JSON payload to send
 * @param {string} options.secret - Secret key for HMAC-SHA256 signature
 * @param {string} options.eventType - Type of event (e.g., 'payment.status.changed')
 * @param {string} [options.modelName] - Name of the model that triggered this webhook
 * @param {string} [options.itemId] - ID of the record that triggered this webhook
 * @param {number} [options.ttlDays] - Days until expiration (default: WEBHOOK_PAYLOAD_TTL_DAYS)
 * @param {Object} [options.sender] - Sender info for audit (default: auto-generated)
 * @returns {Promise<Object>} Created WebhookPayload record
 *
 * @example
 * const webhookPayload = await sendWebhookPayload(context, {
 *     url: 'https://example.com/webhook',
 *     payload: { event: 'payment.status.changed', data: { ... } },
 *     secret: 'webhook-secret',
 *     eventType: 'payment.status.changed',
 *     modelName: 'Payment',
 *     itemId: payment.id,
 * })
 */
async function sendWebhookPayload (context, options) {
    const {
        url,
        payload,
        secret,
        eventType,
        modelName = null,
        itemId = null,
        ttlDays = WEBHOOK_PAYLOAD_TTL_DAYS,
        sender = { dv: 1, fingerprint: 'webhooks-package' },
    } = options

    if (!url || !payload || !secret || !eventType) {
        throw new Error('Missing required parameters: url, payload, secret, and eventType are required')
    }

    // Stringify payload if it's an object (EncryptedText field requires string)
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)

    const webhookPayload = await WebhookPayload.create(context, {
        dv: 1,
        sender,
        payload: payloadString,
        url,
        secret,
        eventType,
        modelName,
        itemId,
        expiresAt: dayjs().add(ttlDays, 'day').toISOString(),
        nextRetryAt: dayjs().toISOString(),
    })

    logger.info({
        msg: 'WebhookPayload created and queued for delivery',
        payloadId: webhookPayload.id,
        eventType,
        modelName,
        itemId,
        url,
    })

    // Queue the webhook payload delivery task
    const { sendWebhookPayload: sendWebhookPayloadTask } = getWebhookTasks()
    await sendWebhookPayloadTask.delay(webhookPayload.id)

    return webhookPayload
}

module.exports = {
    sendWebhookPayload,
}
