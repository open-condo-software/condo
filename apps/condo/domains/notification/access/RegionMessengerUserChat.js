/**
 * Access rules for RegionMessengerUserChat
 */

const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById } = require('@open-condo/keystone/schema')

async function canReadRegionMessengerUserChats ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) return {}

    return { user: { id: user.id } }
}

async function canManageRegionMessengerUserChats ({ authentication: { item: user }, originalInput, operation, itemId }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    if (operation === 'create') {
        return get(originalInput, 'user.connect.id') === user.id
    } else if (operation === 'update') {
        const existedItem = await getById('RegionMessengerUserChat', itemId)

        return existedItem.user === user.id
    }

    return false
}

module.exports = {
    canReadRegionMessengerUserChats,
    canManageRegionMessengerUserChats,
}
