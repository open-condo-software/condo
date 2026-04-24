const crypto = require('node:crypto')

const { EncryptionManager } = require('@open-condo/keystone/crypto/EncryptionManager')
const { find } = require('@open-condo/keystone/schema')

/**
 * Shared webhook callback fields for Invoice and BillingReceipt schemas.
 * These fields enable webhook notifications when payment status changes.
 */

const PAYMENT_STATUS_CHANGE_WEBHOOK_URL_FIELD = {
    schemaDoc: 'URL to call when payment status changes. When set, the system will send HTTP POST requests to this URL with payment status change details. Must be registered in PaymentStatusChangeWebhookUrl.',
    type: 'Url',
    sensitive: true,
    isRequired: false,
}

// EncryptionManager configured to return plain text on creation
// This allows webhook secrets to be returned in plain text when created,
// while still being stored encrypted in the database
const WEBHOOK_SECRET_ENCRYPTION_MANAGER = new EncryptionManager({
    returnPlainTextOnCreate: true,
})

const PAYMENT_STATUS_CHANGE_WEBHOOK_SECRET_FIELD = {
    schemaDoc: 'Secret key used to sign webhook payloads. Auto-generated when paymentStatusChangeWebhookUrl is set. The receiver should use this secret to verify the X-Webhook-Signature header. Returns plain text on creation, encrypted on subsequent reads.',
    type: 'EncryptedText',
    sensitive: true,
    encryptionManager: WEBHOOK_SECRET_ENCRYPTION_MANAGER,
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
 * The generated secret will be returned in plain text on creation thanks to
 * the EncryptedText field resolver with returnPlainTextOnCreate enabled.
 * 
 * @param {Object} resolvedData - The resolved input data
 * @param {Object} existingItem - The existing item (for updates)
 * @returns {Object} Modified resolvedData with generated secret if needed
 */
function applyWebhookSecretGeneration ({ resolvedData, existingItem }) {
    // Only process if the webhook URL field is being updated
    if (!('paymentStatusChangeWebhookUrl' in resolvedData)) {
        return resolvedData
    }

    const { paymentStatusChangeWebhookUrl, paymentStatusChangeWebhookSecret } = resolvedData

    // Normalize empty string to null
    if (paymentStatusChangeWebhookUrl === '') {
        resolvedData.paymentStatusChangeWebhookUrl = null
    }

    const newCallbackUrl = resolvedData.paymentStatusChangeWebhookUrl
    const existingCallbackUrl = existingItem?.paymentStatusChangeWebhookUrl

    // Generate new secret when:
    // 1. URL is being set for the first time (no existing URL, new URL provided)
    // 2. URL is being changed to a different URL (existing URL differs from new URL)
    if (newCallbackUrl && newCallbackUrl !== existingCallbackUrl && !paymentStatusChangeWebhookSecret) {
        const secret = crypto.randomBytes(32).toString('hex')
        resolvedData.paymentStatusChangeWebhookSecret = secret
    }

    // Clear secret if URL is being removed
    if ((newCallbackUrl === null || newCallbackUrl === undefined) && existingCallbackUrl) {
        resolvedData.paymentStatusChangeWebhookSecret = null
    }

    return resolvedData
}

module.exports = {
    PAYMENT_STATUS_CHANGE_WEBHOOK_URL_FIELD,
    PAYMENT_STATUS_CHANGE_WEBHOOK_SECRET_FIELD,
    isWebhookUrlInWhitelist,
    applyWebhookSecretGeneration,
}
