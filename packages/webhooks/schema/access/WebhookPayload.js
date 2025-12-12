const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

/**
 * Admin / support can read all webhook payloads.
 * Regular users cannot access webhook payloads.
 */
async function canReadWebhookPayloads ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) {
        return {}
    }

    return false
}

/**
 * Admin / support can manage all webhook payloads.
 * Regular users cannot manage webhook payloads directly.
 */
async function canManageWebhookPayloads ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return !!(user.isAdmin || user.isSupport)
}

module.exports = {
    canReadWebhookPayloads,
    canManageWebhookPayloads,
}
