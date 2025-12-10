const crypto = require('node:crypto')
const { randomUUID } = require('node:crypto')

const dayjs = require('dayjs')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const {
    WEBHOOK_PAYLOAD_TIMEOUT_MS,
    WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH,
    WEBHOOK_PAYLOAD_RETRY_INTERVALS,
} = require('@open-condo/webhooks/constants')

const logger = getLogger()


/**
 * Generates HMAC-SHA256 signature for webhook payload
 * @param {string} body - JSON string of the payload
 * @param {string} secret - Secret key for signing
 * @returns {string} Hex-encoded signature
 */
function generateSignature (body, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')
}

/**
 * Calculates the next retry timestamp based on attempt number
 * @param {number} attempt - Current attempt number (0-indexed)
 * @returns {string} ISO timestamp for next retry
 */
function calculateNextRetryAt (attempt) {
    const intervals = WEBHOOK_PAYLOAD_RETRY_INTERVALS
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

    try {
        logger.info({
            msg: 'Sending webhook payload',
            reqId,
            data: {
                payloadId: webhookPayload.id,
                url,
                eventType,
                attempt: webhookPayload.attempt + 1,
            },
        })

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Id': webhookPayload.id,
            },
            body,
            abortRequestTimeout: WEBHOOK_PAYLOAD_TIMEOUT_MS,
            maxRetries: 0,
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

        // Determine success (2xx status codes)
        if (response.ok) {
            logger.info({
                msg: 'Webhook payload sent successfully',
                reqId,
                data: {
                    payloadId: webhookPayload.id,
                    statusCode: response.status,
                },
            })
            return {
                success: true,
                statusCode: response.status,
                body: responseBody,
            }
        } else {
            logger.warn({
                msg: 'Webhook payload sending failed with HTTP error',
                reqId,
                data: {
                    payloadId: webhookPayload.id,
                    statusCode: response.status,
                    responseBody,
                },
            })
            return {
                success: false,
                statusCode: response.status,
                body: responseBody,
                error: `HTTP ${response.status}: ${response.statusText}`,
            }
        }
    } catch (err) {
        // Handle timeout and network errors
        const isTimeout = err.message && err.message.includes('Abort request by timeout')
        if (isTimeout) {
            logger.warn({
                msg: 'Webhook payload sending timed out',
                reqId,
                data: {
                    payloadId: webhookPayload.id,
                    timeout: WEBHOOK_PAYLOAD_TIMEOUT_MS,
                },
            })
            return {
                success: false,
                error: `Request timeout after ${WEBHOOK_PAYLOAD_TIMEOUT_MS}ms`,
            }
        }

        logger.error({
            msg: 'Webhook payload sending failed with network error',
            reqId,
            data: { payloadId: webhookPayload.id },
            err,
        })
        return {
            success: false,
            error: err.message || 'Unknown network error',
        }
    }
}

module.exports = {
    generateSignature,
    calculateNextRetryAt,
    trySendWebhookPayload,
}
