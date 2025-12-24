const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { itemsQuery, getSchemaCtx } = require('@open-condo/keystone/schema')
const { WEBHOOK_PAYLOAD_RETENTION_IN_SEC } = require('@open-condo/webhooks/constants')
const { WebhookPayload } = require('@open-condo/webhooks/schema/utils/serverSchema')

const logger = getLogger()

const BATCH_SIZE = 100

/**
 * Hard deletes old WebhookPayload records from the database.
 * Deletes records not updated for more than WEBHOOK_PAYLOAD_RETENTION_IN_SEC (default: 42 days).
 * This helps keep the database clean and prevents unbounded growth of stored data.
 */
async function deleteOldWebhookPayloads () {
    const { keystone } = getSchemaCtx('WebhookPayload')
    const context = await keystone.createContext({ skipAccessControl: true })
    const cutoffDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_IN_SEC, 'second').toISOString()

    logger.info({ msg: 'Starting cleanup of old webhook payloads', data: { cutoffDate, retentionInSec: WEBHOOK_PAYLOAD_RETENTION_IN_SEC } })

    let totalDeleted = 0

    let hasMore = true
    while (hasMore) {
        const oldPayloads = await itemsQuery('WebhookPayload', {
            where: { updatedAt_lt: cutoffDate },
            sortBy: ['updatedAt_ASC'],
            first: BATCH_SIZE,
        })

        if (oldPayloads.length === 0) {
            hasMore = false
        } else {
            try {
                await Promise.all(oldPayloads.map(payload => 
                    WebhookPayload.delete(context, payload.id)
                ))
                totalDeleted += oldPayloads.length
                logger.info({ msg: 'Hard deleted batch of old webhook payloads', data: { batchSize: oldPayloads.length, totalDeleted } })
            } catch (err) {
                logger.error({ msg: 'Failed to delete webhook payloads batch', err, data: { payloadIds: oldPayloads.map(p => p.id) } })
                hasMore = false
            }
        }
    }

    logger.info({ msg: 'Completed cleanup of old webhook payloads', data: { totalDeleted, cutoffDate } })

    return { totalDeleted }
}

module.exports = {
    deleteOldWebhookPayloads,
}
