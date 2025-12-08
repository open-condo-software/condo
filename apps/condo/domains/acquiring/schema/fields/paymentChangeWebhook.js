const crypto = require('node:crypto')

const get = require('lodash/get')

const { find } = require('@open-condo/keystone/schema')

/**
 * Shared webhook callback fields for Invoice and BillingReceipt schemas.
 * These fields enable webhook notifications when payment status changes.
 */

const PAYMENT_STATUS_CHANGE_WEBHOOK_URL_FIELD = {
    schemaDoc: 'URL to call when payment status changes. When set, the system will send HTTP POST requests to this URL with payment status change details. Must be registered in PaymentStatusChangeWebhookUrl.',
    type: 'Url',
    isRequired: false,
}

const PAYMENT_STATUS_CHANGE_WEBHOOK_SECRET_FIELD = {
    schemaDoc: 'Secret key used to sign webhook payloads. Auto-generated when paymentStatusChangeWebhookUrl is set. The receiver should use this secret to verify the X-Condo-Signature header.',
    type: 'Text',
    isRequired: false,
    access: {
        read: true,
        create: false, // Auto-generated only
        update: false, // Cannot be manually changed
    },
}

/**
 * Checks if the callback URL is registered in PaymentStatusChangeWebhookUrl.
 * Use this in validateInput hook of schemas that have webhook callback fields.
 * 
 * @param {string} url - The callback URL to validate
 * @returns {Promise<boolean>} True if URL is in whitelist, false otherwise
 */
async function isWebhookUrlInWhitelist (url) {
    if (!url) {
        return true // No URL to validate
    }

    // Check if URL is in the approved webhook URLs list
    const approvedUrls = await find('PaymentStatusChangeWebhookUrl', {
        url,
        isEnabled: true,
        deletedAt: null,
    })

    return approvedUrls.length > 0
}

/**
 * Hook to auto-generate webhook secret when callback URL is set.
 * Use this in resolveInput hook of schemas that have webhook callback fields.
 * 
 * @param {Object} resolvedData - The resolved data from the mutation
 * @param {Object} existingItem - The existing item (for updates)
 * @returns {Object} Updated resolvedData with secret generation logic applied
 */
function applyWebhookSecretGeneration (resolvedData, existingItem) {
    const existingCallbackUrl = get(existingItem, 'paymentStatusChangeWebhookUrl')
    const newCallbackUrl = get(resolvedData, 'paymentStatusChangeWebhookUrl')
    const existingSecret = get(existingItem, 'paymentStatusChangeWebhookSecret')

    if (newCallbackUrl && !existingSecret) {
        // Generate a new secret only if URL is being set and no secret exists
        resolvedData['paymentStatusChangeWebhookSecret'] = crypto.randomBytes(32).toString('hex')
    } else if (newCallbackUrl === null && existingCallbackUrl) {
        // Clear secret when callback URL is removed
        resolvedData['paymentStatusChangeWebhookSecret'] = null
    }

    return resolvedData
}

module.exports = {
    PAYMENT_STATUS_CHANGE_WEBHOOK_URL_FIELD,
    PAYMENT_STATUS_CHANGE_WEBHOOK_SECRET_FIELD,
    isWebhookUrlInWhitelist,
    applyWebhookSecretGeneration,
}
