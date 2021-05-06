const { getByCondition } = require('@core/keystone/schema');
const { userIsAuthenticated } = require('@core/keystone/access')

async function canManageOrganizations ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return true
    return {
        // user is inside employee list
        employees_some: { user: { id: user.id, canManageOrganization: true } },
    }
}

async function checkOrganizationPermission (userId, organizationId, permission) {
    if (!userId || !organizationId) return false
    const employee = await getByCondition('OrganizationEmployee', {
        organization: { id: organizationId },
        user: { id: userId },
    })
    if (!employee || !employee.role) return false
    const employeeRole = await getByCondition('OrganizationEmployeeRole', {
        id: employee.role,
        organization: { id: organizationId },
    })
    if (!employeeRole) return false
    return employeeRole[permission] || false
}

module.exports = {
    canManageOrganizations,
    canReadOrganizations: userIsAuthenticated,
    checkOrganizationPermission,
}