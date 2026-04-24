const crypto = require('node:crypto')

const dayjs = require('dayjs')

const { fetch, TimeoutError } = require('@open-condo/keystone/fetch')
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
 * @param {string} lastSentAt - ISO timestamp of when the last attempt was made
 * @returns {string} ISO timestamp for next retry
 */
function calculateNextRetryAt (attempt, lastSentAt) {
    const intervals = WEBHOOK_PAYLOAD_RETRY_INTERVALS_IN_SEC
    const delaySeconds = intervals[Math.min(attempt, intervals.length - 1)]
    return dayjs(lastSentAt).add(delaySeconds, 'second').toISOString()
}

/**
 * Attempts to send webhook payload to the target URL
 * Uses stored payload, url, and secret from the WebhookPayload record
 * @param {Object} webhookPayload - WebhookPayload record with payload, url, secret, eventType
 * @returns {Promise<Object>} { success: boolean, statusCode?: number, body?: string, error?: string }
 */
async function trySendWebhookPayload (webhookPayload) {
    const { url, payload, secret, eventType } = webhookPayload
    const reqId = crypto.randomUUID()

    if (!url || !payload || !secret) {
        logger.error({
            msg: 'Missing required payload fields', 
            reqId,
            entity: 'WebhookPayload',
            entityId: webhookPayload.id,
            data: { hasUrl: !!url, hasPayload: !!payload, hasSecret: !!secret },
        })
        return {
            success: false,
            error: 'Missing required payload fields (url, payload, or secret)',
        }
    }

    const signature = generateSignature(payload, secret)

    logger.info({
        msg: 'Sending webhook payload',
        reqId,
        entity: 'WebhookPayload',
        entityId: webhookPayload.id,
        data: {
            payloadId: webhookPayload.id,
            url,
            eventType,
            attempt: webhookPayload.attempt + 1,
            algorithm: WEBHOOK_SIGNATURE_HASH_ALGORITHM,
        },
    })

    /** @type {{ success: boolean, statusCode?: number, body?: string, error?: string, timeout?: number }} */
    let result
    /** @type {Error | null} */
    let error = null

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Signature-Algorithm': WEBHOOK_SIGNATURE_HASH_ALGORITHM,
                'X-Webhook-Id': webhookPayload.id,
            },
            body: payload,
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
        result = {
            success,
            statusCode: response.status,
            body: responseBody,
        }

        if (!success) {
            result.error = `HTTP ${response.status}: ${response.statusText}`
        }
    } catch (err) {
        // Handle timeout and network errors
        // The fetch wrapper throws TimeoutError when abortRequestTimeout is exceeded
        const isTimeout = err instanceof TimeoutError
        if (isTimeout) {
            result = {
                success: false,
                error: `Request timeout after ${WEBHOOK_PAYLOAD_TIMEOUT_IN_MS}ms`,
                timeout: WEBHOOK_PAYLOAD_TIMEOUT_IN_MS,
            }
        } else {
            result = {
                success: false,
                error: err.message || 'Unknown network error',
            }
            error = err
        }
    }

    // Single consolidated result log
    const logData = {
        success: result.success,
        algorithm: WEBHOOK_SIGNATURE_HASH_ALGORITHM,
        timeoutMs: WEBHOOK_PAYLOAD_TIMEOUT_IN_MS,
    }

    const logEntry = {
        msg: 'Webhook payload send result',
        reqId,
        entity: 'WebhookPayload',
        entityId: webhookPayload.id,
        status: result?.statusCode || undefined,
        data: logData,
    }

    if (error) {
        logEntry.err = error
    }

    logger.info(logEntry)

    return result
}

module.exports = {
    generateSignature,
    calculateNextRetryAt,
    trySendWebhookPayload,
}
