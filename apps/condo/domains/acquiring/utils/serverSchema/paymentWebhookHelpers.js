/**
 * Payment-specific webhook helpers
 * These functions help build webhook payloads for payment status changes
 */

const { getById } = require('@open-condo/keystone/schema')


/**
 * Gets the webhook secret from invoice or receipt
 * @param {Object} payment - Payment record
 * @returns {Promise<string|null>} Secret or null if not found
 */
async function getWebhookSecret (payment) {
    // Try to get secret from invoice first
    if (payment.invoice) {
        const invoice = await getById('Invoice', payment.invoice)
        if (invoice && invoice.paymentStatusChangeWebhookSecret) {
            return invoice.paymentStatusChangeWebhookSecret
        }
    }

    // Try to get secret from receipt
    if (payment.receipt) {
        const receipt = await getById('BillingReceipt', payment.receipt)
        if (receipt && receipt.paymentStatusChangeWebhookSecret) {
            return receipt.paymentStatusChangeWebhookSecret
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
        if (invoice && invoice.paymentStatusChangeWebhookUrl) {
            return invoice.paymentStatusChangeWebhookUrl
        }
    }

    // Try to get callback URL from receipt
    if (payment.receipt) {
        const receipt = await getById('BillingReceipt', payment.receipt)
        if (receipt && receipt.paymentStatusChangeWebhookUrl) {
            return receipt.paymentStatusChangeWebhookUrl
        }
    }

    return null
}

/**
 * Builds the webhook payload for a payment status change
 * This payload is ready to be stored in WebhookDelivery and sent
 * @param {Object} payment - Payment record
 * @param {string} previousStatus - Payment status before the change
 * @param {string} newStatus - Payment status after the change
 * @returns {Promise<Object>} Webhook payload
 */
async function buildPaymentWebhookPayload (payment, previousStatus, newStatus) {
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
        eventType: 'payment.status.changed',
        timestamp: new Date().toISOString(),
        data: {
            paymentId: payment.id,
            previousStatus,
            newStatus,
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

module.exports = {
    getWebhookSecret,
    getWebhookCallbackUrl,
    buildPaymentWebhookPayload,
}
