const crypto = require('node:crypto')
const { randomUUID } = require('node:crypto')

const dayjs = require('dayjs')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const {
    WEBHOOK_PAYLOAD_TIMEOUT_IN_MS,
    WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH,
    WEBHOOK_PAYLOAD_RETRY_INTERVALS_IN_SEC,
} = require('@open-condo/webhooks/constants')


const logger = getLogger()

// Possible values (RFC 7518 HS* family): 'sha256', 'sha384', 'sha512'
const WEBHOOK_SIGNATURE_HASH_ALGORITHM = 'sha256'


/**
 * Generates HMAC-SHA256 signature for webhook payload
 * @param {string} body - JSON string of the payload
 * @param {string} secret - Secret key for signing
 * @returns {string} Hex-encoded signature
 */
function generateSignature (body, secret) {
    return crypto
        .createHmac(WEBHOOK_SIGNATURE_HASH_ALGORITHM, secret)
        .update(body)
        .digest('hex')
}

/**
 * Calculates the next retry timestamp based on attempt number
 * @param {number} attempt - Current attempt number (0-indexed)
 * @returns {string} ISO timestamp for next retry
 */
function calculateNextRetryAt (attempt) {
    const intervals = WEBHOOK_PAYLOAD_RETRY_INTERVALS_IN_SEC
    const delaySeconds = intervals[Math.min(attempt, intervals.length - 1)]
    return dayjs().add(delaySeconds, 'second').toISOString()
}

/**
 * Attempts to send webhook payload to the target URL
 * Uses stored payload, url, and secret from the WebhookPayload record
 * @param {Object} webhookPayload - WebhookPayload record with payload, url, secret, eventType
 * @returns {Promise<Object>} { success: boolean, statusCode?: number, body?: string, error?: string }
 */
async function trySendWebhookPayload (webhookPayload) {
    const { url, payload, secret, eventType } = webhookPayload
    const reqId = randomUUID()

    if (!url || !payload || !secret) {
        logger.error({ msg: 'Missing required payload fields', reqId, data: { payloadId: webhookPayload.id, hasUrl: !!url, hasPayload: !!payload, hasSecret: !!secret } })
        return {
            success: false,
            error: 'Missing required payload fields (url, payload, or secret)',
        }
    }

    const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
    const signature = generateSignature(body, secret)

    logger.info({
        msg: 'Sending webhook payload',
        reqId,
        data: {
            payloadId: webhookPayload.id,
            url,
            eventType,
            attempt: webhookPayload.attempt + 1,
            algorithm: WEBHOOK_SIGNATURE_HASH_ALGORITHM,
        },
    })

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Signature-Algorithm': WEBHOOK_SIGNATURE_HASH_ALGORITHM,
                'X-Webhook-Id': webhookPayload.id,
            },
            body,
            maxRetries: 0,
            abortRequestTimeout: WEBHOOK_PAYLOAD_TIMEOUT_IN_MS,
        })

        // Read response body
        let responseBody = null
        try {
            responseBody = await response.text()
            if (responseBody && responseBody.length > WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH) {
                responseBody = responseBody.substring(0, WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH)
            }
        } catch (e) {
            responseBody = `[Could not read response body: ${e.message || String(e)}]`
        }

        const success = response.ok
        const result = {
            success,
            statusCode: response.status,
            body: responseBody,
        }

        if (!success) {
            result.error = `HTTP ${response.status}: ${response.statusText}`
        }

        logger.info({
            msg: 'Webhook payload send result',
            reqId,
            data: {
                payloadId: webhookPayload.id,
                statusCode: response.status,
                success,
                algorithm: WEBHOOK_SIGNATURE_HASH_ALGORITHM,
                error: result.error || null,
            },
        })

        return result
    } catch (err) {
        // Handle timeout and network errors
        // The fetch wrapper throws "Abort request by timeout" when abortRequestTimeout is exceeded
        const isTimeout = err.message && err.message.includes('timeout')
        if (isTimeout) {
            const result = {
                success: false,
                error: `Request timeout after ${WEBHOOK_PAYLOAD_TIMEOUT_IN_MS}ms`,
            }

            logger.info({
                msg: 'Webhook payload send result',
                reqId,
                data: {
                    payloadId: webhookPayload.id,
                    success: false,
                    timeout: WEBHOOK_PAYLOAD_TIMEOUT_IN_MS,
                    algorithm: WEBHOOK_SIGNATURE_HASH_ALGORITHM,
                    error: result.error,
                },
            })

            return result
        }

        const result = {
            success: false,
            error: err.message || 'Unknown network error',
        }

        logger.info({
            msg: 'Webhook payload send result',
            reqId,
            data: {
                payloadId: webhookPayload.id,
                success: false,
                algorithm: WEBHOOK_SIGNATURE_HASH_ALGORITHM,
                error: result.error,
            },
            err,
        })

        return result
    }
}

module.exports = {
    generateSignature,
    calculateNextRetryAt,
    trySendWebhookPayload,
}
