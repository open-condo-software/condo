const { throwAuthenticationError } = require('@miniapp/domains/common/utils/apolloErrorFormatter')
const access = require('@core/keystone/access')

async function canReadUsers ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    return true
}

async function canManageUsers ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    // All users should be exported from condo API!
    // By default this service doesn't need to update User model!
    return false
}

const canAccessToIsAdminField = {
    read: true,
    create: access.userIsAdmin,
    update: access.userIsAdmin,
}

module.exports = {
    canReadUsers,
    canManageUsers,
    canAccessToIsAdminField,
}
