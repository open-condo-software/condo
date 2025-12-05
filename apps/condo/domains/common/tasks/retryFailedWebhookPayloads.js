const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const {
    WEBHOOK_DELIVERY_STATUS_PENDING,
} = require('@condo/domains/common/constants/webhook')
const { sendWebhookPayload } = require('@condo/domains/common/tasks/sendWebhookPayload')


const logger = getLogger('retryFailedWebhookPayloads')

/**
 * Cron task that picks up pending webhook payloads that are due for retry
 * Runs every 5 minutes
 */
async function retryFailedWebhookPayloads () {
    const now = dayjs().toISOString()

    // Find pending payloads that are due for retry and not expired
    const pendingPayloads = await find('WebhookPayload', {
        status: WEBHOOK_DELIVERY_STATUS_PENDING,
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
            await sendWebhookPayload.delay(payload.id)
            logger.info({ msg: 'Queued webhook payload for retry', data: { payloadId: payload.id } })
        } catch (err) {
            logger.error({ msg: 'Failed to queue webhook payload', data: { payloadId: payload.id }, err })
        }
    }
}

module.exports = {
    retryFailedWebhookPayloadsCronTask: createCronTask(
        'retryFailedWebhookPayloads',
        '*/5 * * * *', // Every 5 minutes
        retryFailedWebhookPayloads
    ),
    retryFailedWebhookPayloads,
}
