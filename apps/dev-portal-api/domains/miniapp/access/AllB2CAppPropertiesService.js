/**
 * Generated by `createservice miniapp.AllB2CAppPropertiesService '--type=queries'`
 */
const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { canExecuteB2CAppMutationAsOwner } = require('@dev-portal-api/domains/miniapp/utils/serverSchema/access')

async function canExecuteAllB2CAppProperties (params) {
    const { authentication: { item: user } } = params

    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    return await canExecuteB2CAppMutationAsOwner(params)
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canExecuteAllB2CAppProperties,
}