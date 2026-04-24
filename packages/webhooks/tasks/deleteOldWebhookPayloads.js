const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { itemsQuery, getSchemaCtx } = require('@open-condo/keystone/schema')
const { WEBHOOK_PAYLOAD_RETENTION_IN_SEC } = require('@open-condo/webhooks/constants')
const { WebhookPayload } = require('@open-condo/webhooks/schema/utils/serverSchema')

const logger = getLogger()

const BATCH_SIZE = 100
const MAX_ITERATIONS = 1000 // Prevents infinite loops - max 100,000 records per run (100 * 1000)

/**
 * Hard deletes old WebhookPayload records from the database.
 * Deletes records not updated for more than WEBHOOK_PAYLOAD_RETENTION_IN_SEC (default: 42 days).
 * This helps keep the database clean and prevents unbounded growth of stored data.
 * 
 * @returns {Promise<{totalDeleted: number, totalFailed: number, reachedLimit: boolean}>}
 */
async function deleteOldWebhookPayloads () {
    const { keystone } = getSchemaCtx('WebhookPayload')
    const context = await keystone.createContext({ skipAccessControl: true })
    const cutoffDate = dayjs().subtract(WEBHOOK_PAYLOAD_RETENTION_IN_SEC, 'second').toISOString()

    logger.info({ msg: 'Starting cleanup of old webhook payloads', data: { cutoffDate, retentionInSec: WEBHOOK_PAYLOAD_RETENTION_IN_SEC, maxIterations: MAX_ITERATIONS } })

    let totalDeleted = 0
    let totalFailed = 0
    let iteration = 0

    let hasMore = true
    while (hasMore && iteration < MAX_ITERATIONS) {
        iteration++
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
                totalFailed += failedCount
            } catch (error) {
                // Stop processing if Promise.allSettled itself fails (catastrophic error, not individual deletion failures)
                hasMore = false
                failedCount = oldPayloads.length
                totalFailed += failedCount
                logger.error({ msg: 'Failed to delete webhook payloads', err: error, data: { successCount, failedCount } })
            }
        }
    }

    const reachedLimit = iteration >= MAX_ITERATIONS && hasMore

    const logData = {
        msg: 'Completed cleanup of old webhook payloads',
        count: totalDeleted,
        data: {
            iterations: iteration,
            totalFailed,
            reachedLimit,
            cutoffDate,
            maxIterations: MAX_ITERATIONS,
        },
    }
    
    if (reachedLimit) { logger.warn(logData) } else { logger.info(logData) }

    return { totalDeleted, totalFailed, reachedLimit }
}

module.exports = {
    deleteOldWebhookPayloads,
}
