const crypto = require('crypto')

const dayjs = require('dayjs')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const { getById } = require('@open-condo/keystone/schema')

const {
    INVOICE_WEBHOOK_TIMEOUT_MS,
    INVOICE_WEBHOOK_MAX_RESPONSE_LENGTH,
    INVOICE_WEBHOOK_RETRY_INTERVALS,
} = require('@condo/domains/marketplace/constants')

const logger = getLogger()


/**
 * Builds the webhook payload for an invoice status change
 * @param {Object} delivery - InvoiceWebhookDelivery record
 * @returns {Promise<Object>} Webhook payload
 */
async function buildWebhookPayload (delivery) {
    const invoice = await getById('Invoice', delivery.invoice)
    if (!invoice) {
        throw new Error(`Invoice not found: ${delivery.invoice}`)
    }

    const organization = await getById('Organization', invoice.organization)

    return {
        event: 'invoice.status.changed',
        timestamp: new Date().toISOString(),
        deliveryId: delivery.id,
        attempt: delivery.attempt + 1,
        nextRetryAt: delivery.nextRetryAt,
        expiresAt: delivery.expiresAt,
        data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            previousStatus: delivery.previousStatus,
            newStatus: delivery.newStatus,
            toPay: invoice.toPay,
            paidAt: invoice.paidAt,
            publishedAt: invoice.publishedAt,
            canceledAt: invoice.canceledAt,
            organization: {
                id: organization.id,
                name: organization.name,
            },
        },
    }
}

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
    const intervals = INVOICE_WEBHOOK_RETRY_INTERVALS
    const delaySeconds = intervals[Math.min(attempt, intervals.length - 1)]
    return dayjs().add(delaySeconds, 'second').toISOString()
}

/**
 * Attempts to deliver webhook payload to the callback URL
 * @param {Object} delivery - InvoiceWebhookDelivery record
 * @returns {Promise<Object>} { success: boolean, statusCode?: number, body?: string, error?: string }
 */
async function tryDeliverWebhook (delivery) {
    const { callbackUrl } = delivery

    let payload
    let invoice
    try {
        invoice = await getById('Invoice', delivery.invoice)
        if (!invoice) {
            throw new Error(`Invoice not found: ${delivery.invoice}`)
        }
        payload = await buildWebhookPayload(delivery)
    } catch (err) {
        logger.error({ msg: 'Failed to build webhook payload', err, data: { deliveryId: delivery.id } })
        return {
            success: false,
            error: `Failed to build payload: ${err.message}`,
        }
    }

    // Use invoice-specific secret
    const secret = invoice.statusChangeCallbackSecret
    if (!secret) {
        logger.error({ msg: 'Invoice has no webhook secret', data: { deliveryId: delivery.id, invoiceId: invoice.id } })
        return {
            success: false,
            error: 'Invoice has no webhook secret configured',
        }
    }

    const body = JSON.stringify(payload)
    const signature = generateSignature(body, secret)

    try {
        logger.info({
            msg: 'Sending webhook',
            data: {
                deliveryId: delivery.id,
                callbackUrl,
                attempt: delivery.attempt + 1,
            },
        })

        const response = await fetch(callbackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Condo-Signature': signature,
                'X-Condo-Event': 'invoice.status.changed',
                'X-Condo-Delivery-Id': delivery.id,
            },
            body,
            abortRequestTimeout: INVOICE_WEBHOOK_TIMEOUT_MS,
            maxRetries: 0,
        })

        // Read response body
        let responseBody = null
        try {
            responseBody = await response.text()
            if (responseBody && responseBody.length > INVOICE_WEBHOOK_MAX_RESPONSE_LENGTH) {
                responseBody = responseBody.substring(0, INVOICE_WEBHOOK_MAX_RESPONSE_LENGTH)
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
                    timeout: INVOICE_WEBHOOK_TIMEOUT_MS,
                },
            })
            return {
                success: false,
                error: `Request timeout after ${INVOICE_WEBHOOK_TIMEOUT_MS}ms`,
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
    buildWebhookPayload,
    generateSignature,
    calculateNextRetryAt,
    tryDeliverWebhook,
}
