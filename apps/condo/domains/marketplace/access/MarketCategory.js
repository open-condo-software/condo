/**
 * Generated by `createschema marketplace.MarketCategory 'name:Text; parentCategory:Relationship:MarketCategory:CASCADE;'`
 */

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

async function canReadMarketCategories ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    return {}
}

async function canManageMarketCategories ({ authentication: { item: user }, originalInput, operation, itemId }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    return user.isAdmin || user.isSupport
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadMarketCategories,
    canManageMarketCategories,
}