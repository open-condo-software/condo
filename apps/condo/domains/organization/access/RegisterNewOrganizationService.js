const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')

async function canRegisterNewOrganization({ authentication: { item: user }, args, context }) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return true
    return true
}

module.exports = {
    canRegisterNewOrganization,
}
