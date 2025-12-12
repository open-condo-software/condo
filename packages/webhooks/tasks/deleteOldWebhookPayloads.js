const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { WEBHOOK_PAYLOAD_RETENTION_DAYS } = require('@open-condo/webhooks/constants')


const logger = getLogger('deleteOldWebhookPayloads')

const BATCH_SIZE = 100

/**
 * Hard deletes old WebhookPayload records from the database.
 * Deletes records not updated for more than WEBHOOK_PAYLOAD_RETENTION_DAYS (default: 42 days).
 * This helps keep the database clean and prevents unbounded growth of stored data.
 * 
 * Uses direct knex access for hard delete to bypass GraphQL and access control.
 */
async function deleteOldWebhookPayloads () {
    const { keystone } = getSchemaCtx('WebhookPayload')
    const knex = keystone.adapter.knex
    const cutoffDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_DAYS, 'day').toISOString()

    logger.info({ msg: 'Starting cleanup of old webhook payloads', data: { cutoffDate, retentionDays: WEBHOOK_PAYLOAD_RETENTION_DAYS } })

    let totalDeleted = 0
    let totalHistoryDeleted = 0

    // Delete history records first (they reference the main table via history_id)
    let hasMoreHistory = true
    while (hasMoreHistory) {
        const result = await knex('WebhookPayloadHistoryRecord')
            .whereRaw('"updatedAt" < ?', [cutoffDate])
            .limit(BATCH_SIZE)
            .del()

        if (result === 0) {
            hasMoreHistory = false
        } else {
            totalHistoryDeleted += result
            logger.info({ msg: 'Hard deleted batch of old webhook payload history records', data: { batchSize: result, totalHistoryDeleted } })
        }
    }

    // Delete main records
    let hasMore = true
    while (hasMore) {
        const result = await knex('WebhookPayload')
            .whereRaw('"updatedAt" < ?', [cutoffDate])
            .limit(BATCH_SIZE)
            .del()

        if (result === 0) {
            hasMore = false
        } else {
            totalDeleted += result
            logger.info({ msg: 'Hard deleted batch of old webhook payloads', data: { batchSize: result, totalDeleted } })
        }
    }

    logger.info({ msg: 'Completed cleanup of old webhook payloads', data: { totalDeleted, totalHistoryDeleted, cutoffDate } })

    return { totalDeleted, totalHistoryDeleted }
}

module.exports = {
    deleteOldWebhookPayloads,
}
