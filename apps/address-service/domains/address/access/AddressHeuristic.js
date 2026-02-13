const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

async function canReadAddressHeuristics ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) return {}

    return false
}

async function canManageAddressHeuristics ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return user.isAdmin || user.isSupport
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadAddressHeuristics,
    canManageAddressHeuristics,
}
