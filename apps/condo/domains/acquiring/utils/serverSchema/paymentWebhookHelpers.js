/**
 * Payment-specific webhook helpers
 * These functions help build webhook payloads for payment status changes
 */

const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager')
const { getById } = require('@open-condo/keystone/schema')

// Encryption manager for decrypting EncryptedText fields when using getById
const encryptionManager = new EncryptionManager()

async function getWebhookConfig (payment) {
    let url = null
    let secret = null

    if (payment.invoice) {
        const invoice = await getById('Invoice', payment.invoice)
        if (invoice) {
            if (invoice.paymentStatusChangeWebhookUrl) {
                url = invoice.paymentStatusChangeWebhookUrl
            }
            if (invoice.paymentStatusChangeWebhookSecret) {
                secret = encryptionManager.decrypt(invoice.paymentStatusChangeWebhookSecret)
            }
        }
    } else if (payment.receipt) {
        const receipt = await getById('BillingReceipt', payment.receipt)
        if (receipt) {
            if (receipt.paymentStatusChangeWebhookUrl) {
                url = receipt.paymentStatusChangeWebhookUrl
            }
            if (receipt.paymentStatusChangeWebhookSecret) {
                secret = encryptionManager.decrypt(receipt.paymentStatusChangeWebhookSecret)
            }
        }
    }

    return { url, secret }
}

/**
 * Builds a snapshot of the Payment model for webhook body.
 * Returns a Payment-like object that can be sent as JSON.
 * @param {Object} payment - Payment record (must include current status)
 * @returns {Promise<Object>} Payment-like object
 */
async function buildPaymentWebhookPayload (payment) {
    const organization = await getById('Organization', payment.organization)

    // Get related invoice if exists
    let invoiceData = null
    if (payment.invoice) {
        const invoice = await getById('Invoice', payment.invoice)
        if (invoice) {
            invoiceData = {
                __typename: 'Invoice',
                id: invoice.id,
                number: invoice.number,
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
                __typename: 'BillingReceipt',
                id: receipt.id,
                toPay: receipt.toPay,
                period: receipt.period,
                accountNumber: payment.accountNumber,
            }
        }
    }

    return {
        __typename: 'Payment',
        id: payment.id,
        v: payment.v,
        dv: payment.dv,
        status: payment.status,
        amount: payment.amount,
        currencyCode: payment.currencyCode,
        organization: organization && {
            __typename: 'Organization',
            id: organization.id,
            name: organization.name,
        },
        invoice: invoiceData,
        receipt: receiptData,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
    }
}

module.exports = {
    getWebhookConfig,
    buildPaymentWebhookPayload,
}
