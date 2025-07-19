const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { canDirectlyExecuteService } = require('@condo/domains/user/utils/directAccess')

async function canSendMessage ({ authentication: { item: user }, gqlName }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    return await canDirectlyExecuteService(user, gqlName)
}

module.exports = {
    canSendMessage,
}
