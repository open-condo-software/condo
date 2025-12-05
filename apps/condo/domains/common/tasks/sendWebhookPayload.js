const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const {
    WEBHOOK_DELIVERY_STATUS_PENDING,
    WEBHOOK_DELIVERY_STATUS_SUCCESS,
    WEBHOOK_DELIVERY_STATUS_FAILED,
} = require('@condo/domains/common/constants/webhook')
const { WebhookPayload } = require('@condo/domains/common/utils/serverSchema')
const {
    tryDeliverWebhook,
    calculateNextRetryAt,
} = require('@condo/domains/common/utils/serverSchema/webhookDelivery')


const logger = getLogger('sendWebhookPayload')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'sendWebhookPayload' } }

/**
 * Sends a webhook payload
 * Handles delivery, retries with exponential backoff, and expiration
 * @param {string} payloadId - ID of the WebhookPayload record
 */
async function sendWebhookPayload (payloadId) {
    const { keystone: context } = getSchemaCtx('WebhookPayload')

    const delivery = await getById('WebhookPayload', payloadId)
    if (!delivery) {
        logger.error({ msg: 'Payload record not found', data: { payloadId } })
        return
    }

    // Skip if already completed
    if (delivery.status !== WEBHOOK_DELIVERY_STATUS_PENDING) {
        logger.info({ msg: 'Payload already processed', data: { payloadId, status: delivery.status } })
        return
    }

    const now = dayjs()

    // Check if expired
    if (now.isAfter(delivery.expiresAt)) {
        logger.warn({ msg: 'Payload expired', data: { now, payloadId, expiresAt: delivery.expiresAt } })
        await WebhookPayload.update(context, payloadId, {
            status: WEBHOOK_DELIVERY_STATUS_FAILED,
            lastErrorMessage: 'Payload expired after TTL',
            ...DV_SENDER,
        })
        return
    }

    // Attempt delivery
    const result = await tryDeliverWebhook(delivery)
    const newAttempt = delivery.attempt + 1

    if (result.success) {
        // Success - mark as delivered
        await WebhookPayload.update(context, payloadId, {
            status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
            lastHttpStatusCode: result.statusCode,
            lastResponseBody: result.body,
            lastSentAt: now.toISOString(),
            attempt: newAttempt,
            lastErrorMessage: null,
            ...DV_SENDER,
        })
        logger.info({ msg: 'Webhook delivered successfully', data: { payloadId, attempt: newAttempt } })
    } else {
        // Failure - calculate next retry
        const nextRetryAt = calculateNextRetryAt(newAttempt)
        const nextRetryTime = dayjs(nextRetryAt)

        // Check if next retry would be after expiration
        if (nextRetryTime.isAfter(delivery.expiresAt)) {
            // Mark as permanently failed
            await WebhookPayload.update(context, payloadId, {
                status: WEBHOOK_DELIVERY_STATUS_FAILED,
                lastHttpStatusCode: result.statusCode || null,
                lastResponseBody: result.body || null,
                lastErrorMessage: result.error,
                lastSentAt: now.toISOString(),
                attempt: newAttempt,
                ...DV_SENDER,
            })
            logger.warn({
                msg: 'Webhook payload permanently failed (next retry after expiration)',
                data: { payloadId, attempt: newAttempt, error: result.error },
            })
        } else {
            // Schedule retry
            await WebhookPayload.update(context, payloadId, {
                status: WEBHOOK_DELIVERY_STATUS_PENDING,
                lastHttpStatusCode: result.statusCode || null,
                lastResponseBody: result.body || null,
                lastErrorMessage: result.error,
                lastSentAt: now.toISOString(),
                nextRetryAt,
                attempt: newAttempt,
                ...DV_SENDER,
            })
            logger.info({
                msg: 'Webhook payload failed, scheduled retry',
                data: { payloadId, attempt: newAttempt, nextRetryAt, error: result.error },
            })
        }
    }
}

module.exports = {
    sendWebhookPayload: createTask('sendWebhookPayload', sendWebhookPayload),
    // Export raw function for testing
    _sendWebhookPayload: sendWebhookPayload,
}
