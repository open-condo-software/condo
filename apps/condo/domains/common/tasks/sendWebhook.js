const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const {
    WEBHOOK_DELIVERY_STATUS_PENDING,
    WEBHOOK_DELIVERY_STATUS_SUCCESS,
    WEBHOOK_DELIVERY_STATUS_FAILED,
} = require('@condo/domains/common/constants/webhook')
const { WebhookDelivery } = require('@condo/domains/common/utils/serverSchema')
const {
    tryDeliverWebhook,
    calculateNextRetryAt,
} = require('@condo/domains/common/utils/serverSchema/webhookDelivery')


const logger = getLogger('sendWebhook')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'sendWebhook' } }

/**
 * Sends a webhook delivery
 * Handles delivery, retries with exponential backoff, and expiration
 * @param {string} deliveryId - ID of the WebhookDelivery record
 */
async function sendWebhook (deliveryId) {
    const { keystone: context } = getSchemaCtx('WebhookDelivery')

    const delivery = await getById('WebhookDelivery', deliveryId)
    if (!delivery) {
        logger.error({ msg: 'Delivery record not found', data: { deliveryId } })
        return
    }

    // Skip if already completed
    if (delivery.status !== WEBHOOK_DELIVERY_STATUS_PENDING) {
        logger.info({ msg: 'Delivery already processed', data: { deliveryId, status: delivery.status } })
        return
    }

    const now = dayjs()

    // Check if expired
    if (now.isAfter(delivery.expiresAt)) {
        logger.warn({ msg: 'Delivery expired', data: { now, deliveryId, expiresAt: delivery.expiresAt } })
        await WebhookDelivery.update(context, deliveryId, {
            status: WEBHOOK_DELIVERY_STATUS_FAILED,
            lastErrorMessage: 'Delivery expired after TTL',
            ...DV_SENDER,
        })
        return
    }

    // Attempt delivery
    const result = await tryDeliverWebhook(delivery)
    const newAttempt = delivery.attempt + 1

    if (result.success) {
        // Success - mark as delivered
        await WebhookDelivery.update(context, deliveryId, {
            status: WEBHOOK_DELIVERY_STATUS_SUCCESS,
            lastHttpStatusCode: result.statusCode,
            lastResponseBody: result.body,
            lastSentAt: now.toISOString(),
            attempt: newAttempt,
            lastErrorMessage: null,
            ...DV_SENDER,
        })
        logger.info({ msg: 'Webhook delivered successfully', data: { deliveryId, attempt: newAttempt } })
    } else {
        // Failure - calculate next retry
        const nextRetryAt = calculateNextRetryAt(newAttempt)
        const nextRetryTime = dayjs(nextRetryAt)

        // Check if next retry would be after expiration
        if (nextRetryTime.isAfter(delivery.expiresAt)) {
            // Mark as permanently failed
            await WebhookDelivery.update(context, deliveryId, {
                status: WEBHOOK_DELIVERY_STATUS_FAILED,
                lastHttpStatusCode: result.statusCode || null,
                lastResponseBody: result.body || null,
                lastErrorMessage: result.error,
                lastSentAt: now.toISOString(),
                attempt: newAttempt,
                ...DV_SENDER,
            })
            logger.warn({
                msg: 'Webhook delivery permanently failed (next retry after expiration)',
                data: { deliveryId, attempt: newAttempt, error: result.error },
            })
        } else {
            // Schedule retry
            await WebhookDelivery.update(context, deliveryId, {
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
                msg: 'Webhook delivery failed, scheduled retry',
                data: { deliveryId, attempt: newAttempt, nextRetryAt, error: result.error },
            })
        }
    }
}

module.exports = {
    sendWebhook: createTask('sendWebhook', sendWebhook),
    // Export raw function for testing
    _sendWebhook: sendWebhook,
}
