const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')
const { WEBHOOK_PAYLOAD_STATUS_PENDING } = require('@open-condo/webhooks/constants')
const { getWebhookTasks } = require('@open-condo/webhooks/tasks')


const logger = getLogger('retryFailedWebhookPayloads')

/**
 * Finds pending webhook payloads that are due for retry
 * Returns array of payload IDs to be processed
 * This function is used by the cron task
 */
async function retryFailedWebhookPayloads () {
    const sendWebhookPayloadTask = getWebhookTasks()['sendWebhookPayload']

    const now = dayjs().toISOString()

    // Find pending payloads that are due for retry and not expired
    const pendingPayloads = await find('WebhookPayload', {
        status: WEBHOOK_PAYLOAD_STATUS_PENDING,
        nextRetryAt_lte: now,
        expiresAt_gt: now,
        deletedAt: null,
    })

    if (pendingPayloads.length === 0) {
        logger.info({ msg: 'No pending webhook payloads to retry', data: { now } })
        return
    }

    logger.info({ msg: 'Found pending webhook payloads', data: { now, count: pendingPayloads.length } })

    // Queue each payload for processing
    for (const payload of pendingPayloads) {
        try {
            await sendWebhookPayloadTask.delay(payload.id)
            logger.info({ msg: 'Queued webhook payload for retry', data: { payloadId: payload.id } })
        } catch (err) {
            logger.error({ msg: 'Failed to queue webhook payload', data: { payloadId: payload.id }, err })
        }
    }
}

module.exports = {
    retryFailedWebhookPayloads,
}
