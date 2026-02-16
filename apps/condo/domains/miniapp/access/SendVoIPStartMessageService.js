const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { SERVICE } = require('@condo/domains/user/constants/common')

async function canSendVoIPStartMessage ({ args: { data }, authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    if (user.type === SERVICE) {
        // TODO(YEgorLu): add access to B2C Service User by B2CAppProperty
    }
    
    return false
}

module.exports = {
    canSendVoIPStartMessage,
}