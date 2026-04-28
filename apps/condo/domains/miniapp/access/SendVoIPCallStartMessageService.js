const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { canExecuteServiceAsB2CAppServiceUser } = require('@condo/domains/miniapp/utils/b2cAppServiceUserAccess/server.utils')
const { SERVICE } = require('@condo/domains/user/constants/common')

async function canSendVoIPCallStartMessage (args) {
    const { authentication: { item: user } } = args

    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    if (user.type === SERVICE) {
        return await canExecuteServiceAsB2CAppServiceUser(args)
    }
    
    return false
}

module.exports = {
    canSendVoIPCallStartMessage,
}