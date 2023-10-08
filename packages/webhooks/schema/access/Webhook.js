const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

/**
 * Admin / support can read all webhooks.
 * Users can see only hooks assigned to them
 */
async function canReadWebhooks ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) {
        return {}
    }

    return { user: { id: user.id } }
}

/**
 * Admin / support can manage all webhooks.
 * Users cannot manage webhooks directly, but it's possible to create it on server (via afterChange or custom mutation)
 */
async function canManageWebhooks ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return !!(user.isAdmin || user.isSupport)
}

module.exports = {
    canReadWebhooks,
    canManageWebhooks,
}