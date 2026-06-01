const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { canDirectlyManageSchemaObjects, canDirectlyReadSchemaObjects } = require('@condo/domains/user/utils/directAccess')



async function canReadB2CAppIntercomConfigs ({ authentication: { item: user }, listKey }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    return await canDirectlyReadSchemaObjects(user, listKey)
}

async function canManageB2CAppIntercomConfigs ({ authentication: { item: user }, listKey, originalInput, operation }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    return await canDirectlyManageSchemaObjects(user, listKey, originalInput, operation)
}

module.exports = {
    canManageB2CAppIntercomConfigs,
    canReadB2CAppIntercomConfigs,
}