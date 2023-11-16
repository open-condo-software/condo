const compact = require('lodash/compact')
const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')
const isString = require('lodash/isString')
const uniq = require('lodash/uniq')

const { getByCondition, find } = require('@open-condo/keystone/schema')


async function checkOrganizationPermission (userId, organizationId, permission) {
    if (!userId || !organizationId) return false
    const [employee] = await find('OrganizationEmployee', {
        organization: { id: organizationId },
        user: { id: userId },
        deletedAt: null,
        isBlocked: false,
    })

    if (!permission && employee) {
        return true
    }

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
        deletedAt: null,
    })
    if (!organizationLink) return false

    return checkOrganizationPermission(userId, organizationLink.from, permission)
}

// TODO(nomerdvadcatpyat): use this function where checkRelatedOrganizationPermission and checkOrganizationPermission used together
async function checkPermissionInUserOrganizationOrRelatedOrganization (userId, organizationId, permission) {
    if (!userId || !organizationId) return false

    const hasPermissionInUserOrganization = await checkOrganizationPermission(userId, organizationId, permission)
    if (hasPermissionInUserOrganization) return true
    return await checkRelatedOrganizationPermission(userId, organizationId, permission)
}

/**
 * Check that the user has access in each organization
 *
 * @param userId {string} User.id field
 * @param organizationIds {Array<string>} array of objects related organizations
 * @param permission {string} OrganizationEmployeeRole permission key to check for
 * @return {Promise<{hasAllPermissions: boolean, withPermission: Array<string>, withoutPermission: Array<string>}>}
 */
async function checkOrganizationsPermission (userId, organizationIds, permission) {
    if (!userId || !isArray(organizationIds) || isEmpty(organizationIds)) return {
        hasAllPermissions: false, withPermission: [], withoutPermission: [],
    }

    const uniqOrganizationIds = uniq(organizationIds)

    if (uniqOrganizationIds.some(orgId => !isString(orgId))) {
        return { hasAllPermissions: false, withPermission: [], withoutPermission: uniqOrganizationIds }
    }

    const employees = await find('OrganizationEmployee', {
        organization: { id_in: uniqOrganizationIds },
        user: { id: userId },
        deletedAt: null,
        isBlocked: false,
    })

    if (!employees.length) {
        return { hasAllPermissions: false, withPermission: [], withoutPermission: uniqOrganizationIds }
    }

    const hasPermissionByOrganizationId = uniqOrganizationIds.reduce((acc, orgId) => {
        acc[orgId] = false
        return acc
    }, {})

    if (!permission) {
        for (const employee of employees) {
            const organizationId = employee.organization || null
            if (organizationId) {
                hasPermissionByOrganizationId[organizationId] = true
            }
        }
    } else {
        const employeeRoles = await find('OrganizationEmployeeRole', {
            id_in: compact(employees.map(employee => employee.role)),
            organization: { id_in: uniqOrganizationIds },
        })

        if (!employeeRoles.length) {
            return { hasAllPermissions: false, withPermission: [], withoutPermission: uniqOrganizationIds }
        }

        for (const role of employeeRoles) {
            const hasPermission = role[permission] || false
            const organizationId = role.organization || null
            if (hasPermission && organizationId) {
                hasPermissionByOrganizationId[organizationId] = true
            }
        }
    }

    return Object.entries(hasPermissionByOrganizationId).reduce((acc, [orgId, hasAccess]) => {
        if (hasAccess) {
            acc.withPermission.push(orgId)
        } else {
            acc.hasAllPermissions = false
            acc.withoutPermission.push(orgId)
        }
        return acc
    }, { hasAllPermissions: true, withPermission: [], withoutPermission: [] })
}

/**
 * Check that the user has access in each related organization
 *
 * @param userId {string} User.id field
 * @param organizationIds {Array<string>} array of objects related organizations
 * @param permission {string} OrganizationEmployeeRole permission key to check for
 * @return {Promise<{hasAllPermissions: boolean, withPermission: Array<string>, withoutPermission: Array<string>}>}
 */
async function checkRelatedOrganizationsPermission (userId, organizationIds, permission) {
    if (!userId || !isArray(organizationIds) || isEmpty(organizationIds)) return {
        hasAllPermissions: false, withPermission: [], withoutPermission: [],
    }

    const uniqOrganizationIds = uniq(organizationIds)

    if (uniqOrganizationIds.some(orgId => !isString(orgId))) {
        return { hasAllPermissions: false, withPermission: [], withoutPermission: uniqOrganizationIds }
    }

    const organizationLinks = await find('OrganizationLink', {
        from: queryOrganizationEmployeeFor(userId, permission),
        to: { id_in: uniqOrganizationIds },
        deletedAt: null,
    })

    if (!organizationLinks.length) {
        return { hasAllPermissions: false, withPermission: [], withoutPermission: uniqOrganizationIds }
    }

    const organizationFromIds = compact(uniq(organizationLinks.map(link => link.from || null)))

    const { withPermission } = await checkOrganizationsPermission(userId, organizationFromIds, permission)

    const hasPermissionByOrganizationId = uniqOrganizationIds.reduce((acc, orgId) => {
        acc[orgId] = false
        return acc
    }, {})

    for (const link of organizationLinks) {
        const toId = link.to || null
        const fromId = link.from || null
        if (toId && fromId && withPermission.includes(fromId)) {
            hasPermissionByOrganizationId[toId] = true
        }
    }

    return Object.entries(hasPermissionByOrganizationId).reduce((acc, [orgId, hasAccess]) => {
        if (hasAccess) {
            acc.withPermission.push(orgId)
        } else {
            acc.hasAllPermissions = false
            acc.withoutPermission.push(orgId)
        }
        return acc
    }, { hasAllPermissions: true, withPermission: [], withoutPermission: [] })
}

/**
 * Check permission for user to work with multiple objects in case of usage bulk request
 *
 * Check that the user has access in each organization (own or related)
 *
 * @param userId {string} User.id field
 * @param organizationIds {Array<string>} array of objects related organizations
 * @param permission {string} OrganizationEmployeeRole permission key to check for
 * @return {Promise<{hasAllPermissions: boolean, withPermission: Array<string>, withoutPermission: Array<string>}>}
 */
async function checkPermissionsInUserOrganizationsOrRelatedOrganizations (userId, organizationIds, permission) {
    if (!userId || !isArray(organizationIds) || isEmpty(organizationIds)) return {
        hasAllPermissions: false, withPermission: [], withoutPermission: [],
    }

    const uniqOrganizationIds = uniq(organizationIds)

    if (uniqOrganizationIds.some(orgId => !isString(orgId))) {
        return { hasAllPermissions: false, withPermission: [], withoutPermission: uniqOrganizationIds }
    }

    const hasPermissionByOrganizationId = uniqOrganizationIds.reduce((acc, orgId) => {
        acc[orgId] = false
        return acc
    }, {})

    const { hasAllPermissions, withPermission, withoutPermission } = await checkOrganizationsPermission(userId, uniqOrganizationIds, permission)

    if (hasAllPermissions || isEmpty(withoutPermission)) return { hasAllPermissions, withPermission, withoutPermission }

    for (const organizationId of withPermission) {
        hasPermissionByOrganizationId[organizationId] = true
    }

    const {
        withPermission: withRelatedPermission,
    } = await checkRelatedOrganizationsPermission(userId, withoutPermission, permission)

    for (const organizationId of withRelatedPermission) {
        hasPermissionByOrganizationId[organizationId] = true
    }

    return Object.entries(hasPermissionByOrganizationId).reduce((acc, [orgId, hasAccess]) => {
        if (hasAccess) {
            acc.withPermission.push(orgId)
        } else {
            acc.hasAllPermissions = false
            acc.withoutPermission.push(orgId)
        }
        return acc
    }, { hasAllPermissions: true, withPermission: [], withoutPermission: [] })
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

const queryOrganizationEmployeeFor = (userId, permission) => {
    const baseEmployeeQuery = { user: { id: userId }, isBlocked: false, deletedAt: null }

    if (permission) {
        return { employees_some: { ...baseEmployeeQuery, role: { [permission]: true } } }
    }

    return { employees_some: baseEmployeeQuery }
}
const queryOrganizationEmployeeFromRelatedOrganizationFor = (userId, permission) => ({
    relatedOrganizations_some: {
        AND: [
            { from: queryOrganizationEmployeeFor(userId, permission), deletedAt: null },
        ],
    },
})

const checkUserPermissionsInOrganizations = async ({ userId, organizationIds, permission }) => {
    const userEmployeeOrganizations = await find('Organization', {
        AND: [
            {
                id_in: organizationIds,
            },
            {
                OR: [
                    queryOrganizationEmployeeFor(userId, permission),
                    queryOrganizationEmployeeFromRelatedOrganizationFor(userId, permission),
                ],
            },
        ],
    })

    return userEmployeeOrganizations.length === organizationIds.length
}

module.exports = {
    checkUserPermissionsInOrganizations,
    checkPermissionInUserOrganizationOrRelatedOrganization,
    checkOrganizationPermission,
    checkUserBelongsToOrganization,
    checkRelatedOrganizationPermission,
    queryOrganizationEmployeeFromRelatedOrganizationFor,
    queryOrganizationEmployeeFor,
    checkPermissionsInUserOrganizationsOrRelatedOrganizations,
}
