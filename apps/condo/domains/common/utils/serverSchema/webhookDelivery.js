const crypto = require('crypto')

const dayjs = require('dayjs')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const {
    WEBHOOK_TIMEOUT_MS,
    WEBHOOK_MAX_RESPONSE_LENGTH,
    WEBHOOK_RETRY_INTERVALS,
} = require('@condo/domains/common/constants/webhook')

const logger = getLogger('webhookDelivery')


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
    const intervals = WEBHOOK_RETRY_INTERVALS
    const delaySeconds = intervals[Math.min(attempt, intervals.length - 1)]
    return dayjs().add(delaySeconds, 'second').toISOString()
}

/**
 * Attempts to deliver webhook payload to the target URL
 * Uses stored payload, url, and secret from the delivery record
 * @param {Object} delivery - WebhookDelivery record with payload, url, secret, eventType
 * @returns {Promise<Object>} { success: boolean, statusCode?: number, body?: string, error?: string }
 */
async function tryDeliverWebhook (delivery) {
    const { url, payload, secret, eventType } = delivery

    if (!url || !payload || !secret) {
        logger.error({ msg: 'Missing required delivery fields', data: { deliveryId: delivery.id, hasUrl: !!url, hasPayload: !!payload, hasSecret: !!secret } })
        return {
            success: false,
            error: 'Missing required delivery fields (url, payload, or secret)',
        }
    }

    const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
    const signature = generateSignature(body, secret)

    try {
        logger.info({
            msg: 'Sending webhook',
            data: {
                deliveryId: delivery.id,
                url,
                eventType,
                attempt: delivery.attempt + 1,
            },
        })

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Condo-Signature': signature,
                'X-Condo-Event': eventType || 'unknown',
                'X-Condo-Delivery-Id': delivery.id,
            },
            body,
            abortRequestTimeout: WEBHOOK_TIMEOUT_MS,
            maxRetries: 0,
        })

        // Read response body
        let responseBody = null
        try {
            responseBody = await response.text()
            if (responseBody && responseBody.length > WEBHOOK_MAX_RESPONSE_LENGTH) {
                responseBody = responseBody.substring(0, WEBHOOK_MAX_RESPONSE_LENGTH)
            }
        } catch (e) {
            responseBody = '[Could not read response body]'
        }

        // Determine success (2xx status codes)
        if (response.ok) {
            logger.info({
                msg: 'Webhook delivered successfully',
                data: {
                    deliveryId: delivery.id,
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
                msg: 'Webhook delivery failed with HTTP error',
                data: {
                    deliveryId: delivery.id,
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
                msg: 'Webhook delivery timed out',
                data: {
                    deliveryId: delivery.id,
                    timeout: WEBHOOK_TIMEOUT_MS,
                },
            })
            return {
                success: false,
                error: `Request timeout after ${WEBHOOK_TIMEOUT_MS}ms`,
            }
        }

        logger.error({
            msg: 'Webhook delivery failed with network error',
            data: { deliveryId: delivery.id },
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
    tryDeliverWebhook,
}
