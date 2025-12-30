const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { itemsQuery } = require('@open-condo/keystone/schema')
const { WEBHOOK_PAYLOAD_STATUS_PENDING } = require('@open-condo/webhooks/constants')
const { getWebhookRegularTasks } = require('@open-condo/webhooks/tasks/regularTasks')


const logger = getLogger()
const WEBHOOK_PAYLOADS_RETRY_BATCH_SIZE = 100

/**
 * Finds pending webhook payloads that are due for retry
 * Returns array of payload IDs to be processed
 * This function is used by the cron task
 */
async function retryFailedWebhookPayloads () {
    const { sendWebhookPayload: sendWebhookPayloadTask } = getWebhookRegularTasks()

    const now = dayjs().toISOString()

    let skip = 0
    let queuedCount = 0
    let shouldContinue = true

    while (shouldContinue) {
        const where = {
            status: WEBHOOK_PAYLOAD_STATUS_PENDING,
            nextRetryAt_lte: now,
            expiresAt_gte: now,
            deletedAt: null,
        }

        const pendingPayloadsChunk = await itemsQuery('WebhookPayload', {
            where,
            first: WEBHOOK_PAYLOADS_RETRY_BATCH_SIZE,
            skip,
            sortBy: ['nextRetryAt_ASC', 'id_ASC'],
        })

        if (pendingPayloadsChunk.length === 0) {
            shouldContinue = false
            continue
        }

        queuedCount += pendingPayloadsChunk.length
        skip += pendingPayloadsChunk.length

        // Queue each payload for processing
        for (const payload of pendingPayloadsChunk) {
            try {
                await sendWebhookPayloadTask.delay(payload.id)
                logger.info({ msg: 'Queued webhook payload for retry', entity: 'WebhookPayload', entityId: payload.id })
            } catch (err) {
                logger.error({ msg: 'Failed to queue webhook payload', entity: 'WebhookPayload', entityId: payload.id, err })
            }
        }
    }

    logger.info({ msg: 'Finished retrying webhook payloads', count: queuedCount, data: { now } })
}

module.exports = {
    retryFailedWebhookPayloads,
}
