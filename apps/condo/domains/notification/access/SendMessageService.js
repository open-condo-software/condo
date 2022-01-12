const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')

async function canSendMessage({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return true
    return false
}

module.exports = {
    canSendMessage,
}
