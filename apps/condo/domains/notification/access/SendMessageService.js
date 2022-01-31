const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')

async function canSendMessage ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return Boolean(user.isAdmin)
}

module.exports = {
    canSendMessage,
}
