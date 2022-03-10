const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')

async function canReadPropertyUnitTypes ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isSupport || user.isAdmin) return {}

    return true
}

module.exports = {
    canReadPropertyUnitTypes,
}
