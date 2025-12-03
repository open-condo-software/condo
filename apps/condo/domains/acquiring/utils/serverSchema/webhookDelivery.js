const crypto = require('crypto')

const dayjs = require('dayjs')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const { getById } = require('@open-condo/keystone/schema')

const {
    PAYMENT_WEBHOOK_TIMEOUT_MS,
    PAYMENT_WEBHOOK_MAX_RESPONSE_LENGTH,
    PAYMENT_WEBHOOK_RETRY_INTERVALS,
} = require('@condo/domains/acquiring/constants/webhook')

const logger = getLogger()


/**
 * Builds the webhook payload for a payment status change
 * @param {Object} delivery - PaymentWebhookDelivery record
 * @returns {Promise<Object>} Webhook payload
 */
async function buildWebhookPayload (delivery) {
    const payment = await getById('Payment', delivery.payment)
    if (!payment) {
        throw new Error(`Payment not found: ${delivery.payment}`)
    }

    const organization = await getById('Organization', payment.organization)

    // Get related invoice if exists
    let invoiceData = null
    if (payment.invoice) {
        const invoice = await getById('Invoice', payment.invoice)
        if (invoice) {
            invoiceData = {
                id: invoice.id,
                number: invoice.number,
                status: invoice.status,
                toPay: invoice.toPay,
            }
        }
    }

    // Get related receipt if exists
    let receiptData = null
    if (payment.receipt) {
        const receipt = await getById('BillingReceipt', payment.receipt)
        if (receipt) {
            receiptData = {
                id: receipt.id,
                toPay: receipt.toPay,
                period: receipt.period,
            }
        }
    }

    return {
        event: 'payment.status.changed',
        timestamp: new Date().toISOString(),
        deliveryId: delivery.id,
        attempt: delivery.attempt + 1,
        nextRetryAt: delivery.nextRetryAt,
        expiresAt: delivery.expiresAt,
        data: {
            paymentId: payment.id,
            previousStatus: delivery.previousStatus,
            newStatus: delivery.newStatus,
            amount: payment.amount,
            currencyCode: payment.currencyCode,
            accountNumber: payment.accountNumber,
            organization: {
                id: organization.id,
                name: organization.name,
            },
            invoice: invoiceData,
            receipt: receiptData,
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
    const intervals = PAYMENT_WEBHOOK_RETRY_INTERVALS
    const delaySeconds = intervals[Math.min(attempt, intervals.length - 1)]
    return dayjs().add(delaySeconds, 'second').toISOString()
}

/**
 * Gets the webhook secret from invoice or receipt
 * @param {Object} payment - Payment record
 * @returns {Promise<string|null>} Secret or null if not found
 */
async function getWebhookSecret (payment) {
    // Try to get secret from invoice first
    if (payment.invoice) {
        const invoice = await getById('Invoice', payment.invoice)
        if (invoice && invoice.statusChangeCallbackSecret) {
            return invoice.statusChangeCallbackSecret
        }
    }

    // Try to get secret from receipt
    if (payment.receipt) {
        const receipt = await getById('BillingReceipt', payment.receipt)
        if (receipt && receipt.statusChangeCallbackSecret) {
            return receipt.statusChangeCallbackSecret
        }
    }

    return null
}

/**
 * Gets the webhook callback URL from invoice or receipt
 * @param {Object} payment - Payment record
 * @returns {Promise<string|null>} Callback URL or null if not found
 */
async function getWebhookCallbackUrl (payment) {
    // Try to get callback URL from invoice first
    if (payment.invoice) {
        const invoice = await getById('Invoice', payment.invoice)
        if (invoice && invoice.statusChangeCallbackUrl) {
            return invoice.statusChangeCallbackUrl
        }
    }

    // Try to get callback URL from receipt
    if (payment.receipt) {
        const receipt = await getById('BillingReceipt', payment.receipt)
        if (receipt && receipt.statusChangeCallbackUrl) {
            return receipt.statusChangeCallbackUrl
        }
    }

    return null
}

/**
 * Attempts to deliver webhook payload to the callback URL
 * @param {Object} delivery - PaymentWebhookDelivery record
 * @returns {Promise<Object>} { success: boolean, statusCode?: number, body?: string, error?: string }
 */
async function tryDeliverWebhook (delivery) {
    const { callbackUrl } = delivery

    let payload
    let payment
    try {
        payment = await getById('Payment', delivery.payment)
        if (!payment) {
            throw new Error(`Payment not found: ${delivery.payment}`)
        }
        payload = await buildWebhookPayload(delivery)
    } catch (err) {
        logger.error({ msg: 'Failed to build webhook payload', err, data: { deliveryId: delivery.id } })
        return {
            success: false,
            error: `Failed to build payload: ${err.message}`,
        }
    }

    // Get secret from invoice or receipt
    const secret = await getWebhookSecret(payment)
    if (!secret) {
        logger.error({ msg: 'No webhook secret found for payment', data: { deliveryId: delivery.id, paymentId: payment.id } })
        return {
            success: false,
            error: 'No webhook secret configured for invoice or receipt',
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
                'X-Condo-Event': 'payment.status.changed',
                'X-Condo-Delivery-Id': delivery.id,
            },
            body,
            abortRequestTimeout: PAYMENT_WEBHOOK_TIMEOUT_MS,
            maxRetries: 0,
        })

        // Read response body
        let responseBody = null
        try {
            responseBody = await response.text()
            if (responseBody && responseBody.length > PAYMENT_WEBHOOK_MAX_RESPONSE_LENGTH) {
                responseBody = responseBody.substring(0, PAYMENT_WEBHOOK_MAX_RESPONSE_LENGTH)
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
                    timeout: PAYMENT_WEBHOOK_TIMEOUT_MS,
                },
            })
            return {
                success: false,
                error: `Request timeout after ${PAYMENT_WEBHOOK_TIMEOUT_MS}ms`,
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
    getWebhookSecret,
    getWebhookCallbackUrl,
}
