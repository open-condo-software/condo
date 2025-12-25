const crypto = require('node:crypto')

const dayjs = require('dayjs')

const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const {
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_STATUS_SENT,
    WEBHOOK_PAYLOAD_STATUS_ERROR,
} = require('@open-condo/webhooks/constants')
const { WebhookPayload } = require('@open-condo/webhooks/schema/utils/serverSchema')
const {
    trySendWebhookPayload,
    calculateNextRetryAt,
} = require('@open-condo/webhooks/utils/webhookPayload')


const LOCK_DURATION_IN_SEC = 5 * 60 // 5 minutes - prevents multiple concurrent executions for the same payload to avoid duplicate sends

// Release the lock only if we still own it (prevents deleting another worker's lock after TTL expiration / re-acquire)
const RELEASE_LOCK_SCRIPT = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end
`

const logger = getLogger()

// Encryption manager for decrypting EncryptedText fields when using getById
const encryptionManager = new EncryptionManager()

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'sendWebhookPayload' } }

/**
 * Sends a webhook payload
 * Handles sending, retries with exponential backoff, and expiration
 * @param {string} payloadId - ID of the WebhookPayload record
 */
async function sendWebhookPayload (payloadId) {
    const kvClient = getKVClient('sendWebhookPayload', 'lock')
    const { keystone: context } = getSchemaCtx('WebhookPayload')

    const lockKey = `sendWebhookPayload:${payloadId}`
    const lockValue = crypto.randomUUID()
    const lockResult = await kvClient.set(lockKey, lockValue, 'EX', LOCK_DURATION_IN_SEC, 'NX')
    if (lockResult !== 'OK') {
        logger.info({ msg: 'Payload already in progress', entity: 'WebhookPayload', entityId: payloadId })
        return
    }

    let executionOutcome = 'unknown'
    let executionData = {}

    try {
        const webhookPayload = await getById('WebhookPayload', payloadId)
        if (!webhookPayload) {
            executionOutcome = 'not_found'
            logger.error({ msg: 'Payload record not found', entity: 'WebhookPayload', entityId: payloadId })
            return
        }

        // Skip if already completed
        if (webhookPayload.status !== WEBHOOK_PAYLOAD_STATUS_PENDING) {
            executionOutcome = 'already_processed'
            executionData = { status: webhookPayload.status }
            return
        }

        const now = dayjs()

        // Check if expired
        if (now.isAfter(webhookPayload.expiresAt)) {
            executionOutcome = 'expired'
            executionData = { now, expiresAt: webhookPayload.expiresAt }
            logger.warn({ msg: 'Payload expired', entity: 'WebhookPayload', entityId: payloadId, data: executionData })
            await WebhookPayload.update(context, payloadId, {
                status: WEBHOOK_PAYLOAD_STATUS_ERROR,
                lastErrorMessage: 'Payload expired after TTL',
                ...DV_SENDER,
            })
            return
        }

        // Decrypt EncryptedText fields (getById returns raw encrypted values)
        const decryptedPayload = {
            ...webhookPayload,
            payload: encryptionManager.decrypt(webhookPayload.payload),
            secret: encryptionManager.decrypt(webhookPayload.secret),
        }

        // Attempt to send
        const result = await trySendWebhookPayload(decryptedPayload)
        const newAttempt = webhookPayload.attempt + 1

        if (result.success) {
            // Success - means sent
            executionOutcome = 'sent'
            executionData = { attempt: newAttempt }
            await WebhookPayload.update(context, payloadId, {
                status: WEBHOOK_PAYLOAD_STATUS_SENT,
                lastHttpStatusCode: result.statusCode,
                lastResponseBody: result.body,
                lastSentAt: now.toISOString(),
                attempt: newAttempt,
                lastErrorMessage: null,
                ...DV_SENDER,
            })
        } else {
            // Failure - calculate next retry
            const lastSentAt = now.toISOString()
            const nextRetryAt = calculateNextRetryAt(newAttempt, lastSentAt)
            const nextRetryTime = dayjs(nextRetryAt)

            // Check if next retry would be after expiration
            if (nextRetryTime.isAfter(webhookPayload.expiresAt)) {
                // Mark as permanently failed
                executionOutcome = 'permanently_failed'
                executionData = { attempt: newAttempt, error: result.error }
                await WebhookPayload.update(context, payloadId, {
                    status: WEBHOOK_PAYLOAD_STATUS_ERROR,
                    lastHttpStatusCode: result.statusCode || null,
                    lastResponseBody: result.body || null,
                    lastErrorMessage: result.error,
                    lastSentAt: now.toISOString(),
                    attempt: newAttempt,
                    ...DV_SENDER,
                })
                logger.warn({
                    msg: 'Webhook payload permanently failed (next retry after expiration)',
                    entity: 'WebhookPayload',
                    entityId: payloadId,
                    data: executionData,
                })
            } else {
                // Schedule retry
                executionOutcome = 'retry_scheduled'
                executionData = { attempt: newAttempt, nextRetryAt, error: result.error }
                await WebhookPayload.update(context, payloadId, {
                    status: WEBHOOK_PAYLOAD_STATUS_PENDING,
                    lastHttpStatusCode: result.statusCode || null,
                    lastResponseBody: result.body || null,
                    lastErrorMessage: result.error,
                    lastSentAt: now.toISOString(),
                    nextRetryAt,
                    attempt: newAttempt,
                    ...DV_SENDER,
                })
            }
        }
    } catch (err) {
        executionOutcome = 'error'
        executionData = { error: err.message }
        logger.error({ msg: 'Error sending webhook payload', err, entity: 'WebhookPayload', entityId: payloadId })
    } finally {
        try {
            await kvClient.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, lockValue)
        } catch (err) {
            logger.error({ msg: 'Error releasing lock', err, entity: 'WebhookPayload', entityId: payloadId })
        }

        logger.info({
            msg: 'Webhook payload processing completed',
            entity: 'WebhookPayload',
            entityId: payloadId,
            data: { outcome: executionOutcome, ...executionData },
        })
    }
}

module.exports = {
    sendWebhookPayload,
}
