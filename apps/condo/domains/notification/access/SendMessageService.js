const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

async function canSendMessage ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return !!user.isAdmin
}

module.exports = {
    canSendMessage,
}
