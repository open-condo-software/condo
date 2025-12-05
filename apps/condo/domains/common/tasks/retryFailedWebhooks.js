const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const {
    WEBHOOK_DELIVERY_STATUS_PENDING,
} = require('@condo/domains/common/constants/webhook')
const { sendWebhook } = require('@condo/domains/common/tasks/sendWebhook')


const logger = getLogger('retryFailedWebhooks')

/**
 * Cron task that picks up pending webhook deliveries that are due for retry
 * Runs every 5 minutes
 */
async function retryFailedWebhooks () {
    const now = dayjs().toISOString()

    // Find pending deliveries that are due for retry and not expired
    const pendingDeliveries = await find('WebhookDelivery', {
        status: WEBHOOK_DELIVERY_STATUS_PENDING,
        nextRetryAt_lte: now,
        expiresAt_gt: now,
        deletedAt: null,
    })

    if (pendingDeliveries.length === 0) {
        logger.info({ msg: 'No pending webhook deliveries to retry', data: { now } })
        return
    }

    logger.info({ msg: 'Found pending webhook deliveries', data: { now, count: pendingDeliveries.length } })

    // Queue each delivery for processing
    for (const delivery of pendingDeliveries) {
        try {
            await sendWebhook.delay(delivery.id)
            logger.info({ msg: 'Queued webhook delivery for retry', data: { deliveryId: delivery.id } })
        } catch (err) {
            logger.error({ msg: 'Failed to queue webhook delivery', data: { deliveryId: delivery.id }, err })
        }
    }
}

module.exports = {
    retryFailedWebhooksCronTask: createCronTask(
        'retryFailedWebhooks',
        '*/5 * * * *', // Every 5 minutes
        retryFailedWebhooks
    ),
    retryFailedWebhooks,
}
