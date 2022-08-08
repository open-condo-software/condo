const { throwAuthenticationError } = require('@condo/keystone/apolloErrorFormatter')

async function canRegisterNewOrganization ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    return true
}

module.exports = {
    canRegisterNewOrganization,
}
