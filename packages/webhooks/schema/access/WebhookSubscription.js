const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

/**
 * Admin / support can read all webhook subscriptions.
 * Users can see only subscriptions with non-deleted hooks assigned to them
 */
async function canReadWebhookSubscriptions ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) {
        return {}
    }

    return { webhook: { user: { id: user.id }, deletedAt: null } }
}

/**
 * Admin / support can manage all webhook subscriptions.
 * Users cannot manage subscriptions directly, but it's possible to create it on server (via afterChange or custom mutation)
 */
async function canManageWebhookSubscriptions ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return !!(user.isAdmin || user.isSupport)
}

module.exports = {
    canReadWebhookSubscriptions,
    canManageWebhookSubscriptions,
}