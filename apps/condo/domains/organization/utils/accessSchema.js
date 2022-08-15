const { getByCondition, find } = require('@condo/keystone/schema')

async function checkOrganizationPermission (userId, organizationId, permission) {
    if (!userId || !organizationId) return false
    const [employee] = await find('OrganizationEmployee', {
        organization: { id: organizationId },
        user: { id: userId },
        deletedAt: null,
        isBlocked: false,
    })

    if (!employee || !employee.role) {
        return false
    }

    const [employeeRole] = await find('OrganizationEmployeeRole', {
        id: employee.role,
        organization: { id: organizationId },
    })

    if (!employeeRole) return false
    return employeeRole[permission] || false
}

async function checkRelatedOrganizationPermission (userId, organizationId, permission) {
    if (!userId || !organizationId) return false
    const [organizationLink] = await find('OrganizationLink', {
        from: queryOrganizationEmployeeFor(userId),
        to: { id: organizationId },
    })
    if (!organizationLink) return false

    return checkOrganizationPermission(userId, organizationLink.from, permission)
}

// TODO(nomerdvadcatpyat): use this function where checkRelatedOrganizationPermission and checkOrganizationPermission used together
async function checkPermissionInUserOrganizationOrRelatedOrganization (userId, organizationId, permission) {
    if (!userId || !organizationId) return false
    const hasPermissionInRelatedOrganization = await checkRelatedOrganizationPermission(userId, organizationId, permission)
    const hasPermissionInUserOrganization = await checkOrganizationPermission(userId, organizationId, permission)
    return Boolean(hasPermissionInRelatedOrganization || hasPermissionInUserOrganization)
}

async function checkUserBelongsToOrganization (userId, organizationId) {
    if (!userId || !organizationId) return false
    const employee = await getByCondition('OrganizationEmployee', {
        organization: { id: organizationId },
        user: { id: userId },
        isAccepted: true,
        isBlocked: false,
        isRejected: false,
        deletedAt: null,
    })

    if (!employee) {
        return false
    }

    if (employee.isBlocked) {
        return false
    }

    return employee.deletedAt === null
}

const queryOrganizationEmployeeFor = userId => ({ employees_some: { user: { id: userId }, isBlocked: false, deletedAt: null } })
const queryOrganizationEmployeeFromRelatedOrganizationFor = userId => ({ relatedOrganizations_some: { from: queryOrganizationEmployeeFor(userId) } })

module.exports = {
    checkPermissionInUserOrganizationOrRelatedOrganization,
    checkOrganizationPermission,
    checkUserBelongsToOrganization,
    checkRelatedOrganizationPermission,
    queryOrganizationEmployeeFromRelatedOrganizationFor,
    queryOrganizationEmployeeFor,
}
