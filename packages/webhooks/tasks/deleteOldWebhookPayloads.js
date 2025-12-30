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
            let successCount = 0
            let failedCount = 0
            let error = null
            try {
                // Use Promise.allSettled instead of Promise.all to ensure all deletion attempts are made
                // even if some individual deletions fail. This prevents one failed deletion from stopping
                // the entire batch and allows us to track partial success.
                const results = await Promise.allSettled(oldPayloads.map(payload => 
                    WebhookPayload.delete(context, payload.id)
                ))
                successCount = results.filter(r => r.status === 'fulfilled').length
                failedCount = results.filter(r => r.status === 'rejected').length
                totalDeleted += successCount
            } catch (err) {
                // Stop processing if Promise.allSettled itself fails (catastrophic error, not individual deletion failures)
                hasMore = false
                failedCount = oldPayloads.length
                error = err
            } finally {
                logger.info({ msg: 'Processed webhook payloads deletion batch', err: error, data: { successCount, failedCount } })
            }
        }
    }

    logger.info({ msg: 'Completed cleanup of old webhook payloads', data: { totalDeleted, cutoffDate } })

    return { totalDeleted }
}

module.exports = {
    deleteOldWebhookPayloads,
}
