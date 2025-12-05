const crypto = require('crypto')

const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { find } = require('@open-condo/keystone/schema')

/**
 * Shared webhook callback fields for Invoice and BillingReceipt schemas.
 * These fields enable webhook notifications when payment status changes.
 */

const ERRORS = {
    WEBHOOK_URL_NOT_IN_WHITELIST: {
        code: BAD_USER_INPUT,
        type: 'WEBHOOK_URL_NOT_IN_WHITELIST',
        message: 'The webhook URL must be registered in PaymentStatusChangeWebhookUrl',
        messageForUser: 'api.acquiring.webhook.WEBHOOK_URL_NOT_IN_WHITELIST',
    },
}

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
 * Validates that the callback URL is registered in PaymentStatusChangeWebhookUrl.
 * Use this in validateInput hook of schemas that have webhook callback fields.
 * Throws GQLError if URL is not in whitelist.
 * 
 * @param {string} callbackUrl - The callback URL to validate
 * @param {Object} context - Keystone context for error handling
 * @throws {GQLError} If callback URL is not in whitelist
 */
async function validateCallbackUrlInWhitelist (callbackUrl, context) {
    if (!callbackUrl) {
        return // No URL to validate
    }

    // Check if URL is in the approved webhook URLs list
    const approvedUrls = await find('PaymentStatusChangeWebhookUrl', {
        url: callbackUrl,
        isEnabled: true,
        deletedAt: null,
    })

    if (approvedUrls.length === 0) {
        throw new GQLError(ERRORS.WEBHOOK_URL_NOT_IN_WHITELIST, context)
    }
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
    validateCallbackUrlInWhitelist,
    applyWebhookSecretGeneration,
}
