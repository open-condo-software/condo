const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { itemsQuery } = require('@open-condo/keystone/schema')
const { WEBHOOK_PAYLOAD_STATUS_PENDING } = require('@open-condo/webhooks/constants')
const { getWebhookRegularTasks } = require('@open-condo/webhooks/tasks/regularTasks')


const logger = getLogger()
const WEBHOOK_PAYLOADS_RETRY_BATCH_SIZE = 100
const MAX_ITERATIONS = 1000 // Prevents infinite loops - max 100,000 records per run (100 * 1000)

/**
 * Finds pending webhook payloads that are due for retry
 * Returns array of payload IDs to be processed
 * This function is used by the cron task
 */
async function retryFailedWebhookPayloads () {
    const { sendWebhookPayload: sendWebhookPayloadTask } = getWebhookRegularTasks()

    const cutoffTime = dayjs().toISOString()

    logger.info({ msg: 'Starting retry of failed webhook payloads', data: { cutoffTime, maxIterations: MAX_ITERATIONS } })

    let skip = 0
    let queuedCount = 0
    let iteration = 0
    let shouldContinue = true

    while (shouldContinue && iteration < MAX_ITERATIONS) {
        iteration++
        const where = {
            status: WEBHOOK_PAYLOAD_STATUS_PENDING,
            nextRetryAt_lte: cutoffTime,
            expiresAt_gte: cutoffTime,
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

    const reachedLimit = iteration >= MAX_ITERATIONS && shouldContinue

    const logData = {
        msg: 'Finished retrying webhook payloads',
        count: queuedCount,
        data: {
            iterations: iteration,
            reachedLimit,
            cutoffTime,
        },
    }
    
    if (reachedLimit) { logger.warn(logData) } else { logger.info(logData) }
}

module.exports = {
    retryFailedWebhookPayloads,
}
