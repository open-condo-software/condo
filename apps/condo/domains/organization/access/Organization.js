const { userIsAuthenticated } = require('@core/keystone/access')

async function canManageOrganizations ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return true
    return {
        // user is inside employee list
        employees_some: { user: { id: user.id, canManageOrganization: true } },
    }
}

module.exports = {
    canManageOrganizations,
    canReadOrganizations: userIsAuthenticated,
}