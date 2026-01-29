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
    schemaDoc: 'Secret key used to sign webhook payloads. Auto-generated when paymentStatusChangeWebhookUrl is set. The receiver should use this secret to verify the X-Webhook-Signature header. Returns plain text on creation, encrypted on subsequent reads.',
    type: 'EncryptedText',
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
 * Returns plain text webhook secret on creation by replacing encrypted value.
 * Use this in afterChange hook of schemas that have webhook callback fields.
 * 
 * @param {Object} context - The Keystone context
 * @param {string} operation - The operation type ('create' or 'update')
 * @param {Object} updatedItem - The updated item
 */
function returnPlainTextWebhookSecretOnCreation ({ context, operation, updatedItem }) {
    // Return plain text webhook secret on creation
    if (operation === 'create' && context && context.req && context.req._plainWebhookSecret) {
        // Replace the encrypted secret with plain text for the response
        updatedItem.paymentStatusChangeWebhookSecret = context.req._plainWebhookSecret
        // Clean up
        delete context.req._plainWebhookSecret
    }
}

/**
 * Hook to auto-generate webhook secret when callback URL is set.
 * Use this in resolveInput hook of schemas that have webhook callback fields.
 * 
 * @param {Object} resolvedData - The resolved data from the mutation
 * @param {Object} existingItem - The existing item (for updates)
 * @param {Object} context - The Keystone context (optional, for storing plain text secret)
 * @returns {Object} Updated resolvedData with secret generation logic applied
 */
function applyWebhookSecretGeneration (resolvedData, existingItem, context = null) {
    const existingCallbackUrl = get(existingItem, 'paymentStatusChangeWebhookUrl')
    
    // Check if the webhook URL field is present in resolvedData
    const hasWebhookUrlField = 'paymentStatusChangeWebhookUrl' in resolvedData
    
    if (!hasWebhookUrlField) {
        // Field not being updated, do nothing
        return resolvedData
    }
    
    let newCallbackUrl = resolvedData.paymentStatusChangeWebhookUrl

    // Normalize empty string to null
    if (newCallbackUrl === '') {
        newCallbackUrl = null
        resolvedData['paymentStatusChangeWebhookUrl'] = null
    }

    // Generate new secret when:
    // 1. URL is being set for the first time (no existing URL, new URL provided)
    // 2. URL is being changed to a different URL (existing URL differs from new URL)
    if (newCallbackUrl && newCallbackUrl !== existingCallbackUrl) {
        const plainTextSecret = crypto.randomBytes(32).toString('hex')
        resolvedData['paymentStatusChangeWebhookSecret'] = plainTextSecret
        
        // Store plain text secret in context so it can be returned unencrypted after creation
        // The EncryptedText field will encrypt it before storing in DB, but we need to return
        // the plain text version to the API consumer so they can verify webhook signatures
        if (context && context.req) {
            context.req._plainWebhookSecret = plainTextSecret
        }
    } else if ((newCallbackUrl === null || newCallbackUrl === undefined) && existingCallbackUrl) {
        // Clear secret when callback URL is explicitly removed
        resolvedData['paymentStatusChangeWebhookSecret'] = null
    }

    return resolvedData
}

module.exports = {
    PAYMENT_STATUS_CHANGE_WEBHOOK_URL_FIELD,
    PAYMENT_STATUS_CHANGE_WEBHOOK_SECRET_FIELD,
    isWebhookUrlInWhitelist,
    applyWebhookSecretGeneration,
    returnPlainTextWebhookSecretOnCreation,
}
