const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { canDirectlyManageSchemaObjects } = require('@condo/domains/user/utils/directAccess')

/**
 * 1. Admin / support
 * 2. Users with direct access
 * 3. Any employees of any organization
 */
async function canReadB2BAppNewsSharingConfigs ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return {}
}

/**
 * 1. Admin / support
 * 2. Users with direct access
 */
async function canManageB2BAppNewsSharingConfigs ({ authentication: { item: user }, listKey, originalInput, operation }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isSupport || user.isAdmin) return true

    return await canDirectlyManageSchemaObjects(user, listKey, originalInput, operation)
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadB2BAppNewsSharingConfigs,
    canManageB2BAppNewsSharingConfigs,
}
