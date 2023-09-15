const { getByCondition, find } = require('@open-condo/keystone/schema')

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

async function checkOrganizationsPermission (userId, organizationIds, permission) {
    if (!userId || !organizationIds.length) return false
    const employees = await find('OrganizationEmployee', {
        organization: { id_in: organizationIds },
        user: { id: userId },
        deletedAt: null,
        isBlocked: false,
    })

    if (!employees.length || !employees.every(employee => employee.role)) {
        return false
    }

    const employeeRoles = await find('OrganizationEmployeeRole', {
        id_in: employees.map(employee => employee.role),
        organization: { id_in: organizationIds },
    })

    if (!employeeRoles.length) return false
    return employeeRoles.every(role => role[permission]) || false
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

async function checkRelatedOrganizationsPermission (userId, organizationIds, permission) {
    if (!userId || !organizationIds.length) return false
    const organizationLinks = await find('OrganizationLink', {
        from: queryOrganizationEmployeeFor(userId),
        to: { id_in: organizationIds },
    })

    if (!organizationLinks.length) {
        return false
    }
    const organizationFromIds = organizationLinks.map(link => link.from)

    return checkOrganizationsPermission(userId, organizationFromIds, permission)
}

// TODO(nomerdvadcatpyat): use this function where checkRelatedOrganizationPermission and checkOrganizationPermission used together
async function checkPermissionInUserOrganizationOrRelatedOrganization (userId, organizationId, permission) {
    if (!userId || !organizationId) return false
    const hasPermissionInRelatedOrganization = await checkRelatedOrganizationPermission(userId, organizationId, permission)
    const hasPermissionInUserOrganization = await checkOrganizationPermission(userId, organizationId, permission)

    return Boolean(hasPermissionInRelatedOrganization || hasPermissionInUserOrganization)
}

/**
 * Check permission for user to work with multiple objects in case of usage bulk request
 * @param userId {string} User.id field
 * @param organizationIds {Array<string>} array of objects related organizations
 * @param permission {string} OrganizationEmployeeRole permission key to check for
 * @return {Promise<boolean>}
 */
async function checkPermissionsInUserOrganizationsOrRelatedOrganizations (userId, organizationIds, permission) {
    if (!userId || !organizationIds.length) return false
    const hasPermissionInRelatedOrganizations = await checkRelatedOrganizationsPermission(userId, organizationIds, permission)
    const hasPermissionInUserOrganizations = await checkOrganizationsPermission(userId, organizationIds, permission)

    return Boolean(hasPermissionInRelatedOrganizations || hasPermissionInUserOrganizations)
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
    checkOrganizationsPermission,
    checkPermissionsInUserOrganizationsOrRelatedOrganizations,
}
