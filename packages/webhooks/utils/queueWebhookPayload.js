const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { WEBHOOK_PAYLOAD_TTL_IN_SEC } = require('@open-condo/webhooks/constants')
const { WebhookPayload } = require('@open-condo/webhooks/schema/utils/serverSchema')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')

const logger = getLogger('sendWebhookPayload')

/**
 * Creates a WebhookPayload record and queues it for sending.
 * This is a convenience function that handles both creating the payload record
 * and scheduling the sending task.
 *
 * @param {Object} context - Keystone context
 * @param {Object} options - Webhook payload options
 * @param {string} options.url - Target URL for webhook sending
 * @param {Object|string} options.payload - JSON payload to send
 * @param {string} options.secret - Secret key for HMAC-SHA256 signature
 * @param {string} options.eventType - Type of event (e.g., 'payment.status.changed')
 * @param {string} [options.modelName] - Name of the model that triggered this webhook
 * @param {string} [options.itemId] - ID of the record that triggered this webhook
 * @param {number} [options.ttlInSec] - Seconds until expiration (default: WEBHOOK_PAYLOAD_TTL_IN_SEC)
 * @param {Object} options.sender - Sender info for audit (required)
 * @returns {Promise<Object>} Created WebhookPayload record
 *
 * @example
 * const webhookPayload = await queueWebhookPayload(context, {
 *     url: 'https://example.com/webhook',
 *     payload: { event: 'payment.status.changed', data: { ... } },
 *     secret: 'webhook-secret',
 *     eventType: 'payment.status.changed',
 *     modelName: 'Payment',
 *     itemId: payment.id,
 *     sender: { dv: 1, fingerprint: 'your-service-name' },
 * })
 */
async function queueWebhookPayload (context, options) {
    const {
        url,
        payload,
        secret,
        eventType,
        modelName = null,
        itemId = null,
        ttlInSec = WEBHOOK_PAYLOAD_TTL_IN_SEC,
        sender,
    } = options

    if (!url || !payload || !secret || !eventType || !sender) {
        throw new Error('Missing required parameters: url, payload, secret, eventType, and sender are required')
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
        expiresAt: dayjs().add(ttlInSec, 'second').toISOString(),
        nextRetryAt: dayjs().toISOString(),
    })

    logger.info({
        msg: 'WebhookPayload created and queued for sending',
        entity: 'WebhookPayload',
        entityId: webhookPayload.id,
        data: {
            eventType,
            modelName,
            itemId,
            url,
        },
    })

    // Queue the webhook payload sending task
    const { sendWebhookPayload: sendWebhookPayloadTask } = getWebhookTasks()
    await sendWebhookPayloadTask.delay(webhookPayload.id)

    return webhookPayload
}

module.exports = {
    queueWebhookPayload,
}
