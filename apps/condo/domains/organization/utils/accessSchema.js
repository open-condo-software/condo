const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')
const uniq = require('lodash/uniq')
const { validate: isUUID } = require('uuid')

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

async function checkPermissionsInUserOrganizationOrRelatedOrganization (userId, organizationId, permissions) {
    if (!userId || !organizationId) return false

    const promises = []
    for (const permission of permissions) {
        promises.push(new Promise((resolve) => {
            checkPermissionInUserOrganizationOrRelatedOrganization(userId, organizationId, permission).then((res) => {
                resolve(res)
            }).catch(() => {
                resolve(false)
            })
        }))
    }

    const results = await Promise.all(promises)

    return results.every((result) => result === true)
}

/**
 * Check that the user has access in each organization
 *
 * @param userId {string} User.id field
 * @param organizationIds {Array<string>} array of objects related organizations
 * @param permission {string} OrganizationEmployeeRole permission key to check for
 * @return {Promise<boolean>}
 */
async function checkOrganizationsPermission (userId, organizationIds, permission) {
    if (!userId || !isArray(organizationIds) || isEmpty(organizationIds)) return false

    const uniqOrganizationIds = uniq(organizationIds)

    if (!uniqOrganizationIds.every(isUUID)) return false

    for (const id of organizationIds) {
        const hasAccess = await checkOrganizationPermission(userId, id, permission)
        if (!hasAccess) return false
    }

    return true
}

/**
 * Check that the user has access in each related organization
 *
 * @param userId {string} User.id field
 * @param organizationIds {Array<string>} array of objects related organizations
 * @param permission {string} OrganizationEmployeeRole permission key to check for
 * @return {Promise<boolean>}
 */
async function checkRelatedOrganizationsPermission (userId, organizationIds, permission) {
    if (!userId || !isArray(organizationIds) || isEmpty(organizationIds)) return false

    const uniqOrganizationIds = uniq(organizationIds)

    if (!uniqOrganizationIds.every(isUUID)) return false

    for (const id of organizationIds) {
        const hasAccess = await checkRelatedOrganizationPermission(userId, id, permission)
        if (!hasAccess) return false
    }

    return true
}

/**
 * Check permission for user to work with multiple objects in case of usage bulk request
 *
 * Check that the user has access in each organization (own or related)
 *
 * @param userId {string} User.id field
 * @param organizationIds {Array<string>} array of objects related organizations
 * @param permission {string} OrganizationEmployeeRole permission key to check for
 * @return {Promise<boolean>}
 */
async function checkPermissionsInUserOrganizationsOrRelatedOrganizations (userId, organizationIds, permission) {
    if (!userId || !isArray(organizationIds) || isEmpty(organizationIds)) return false

    const uniqOrganizationIds = uniq(organizationIds)

    if (!uniqOrganizationIds.every(isUUID)) return false

    for (const id of organizationIds) {
        const hasAccess = await checkPermissionInUserOrganizationOrRelatedOrganization(userId, id, permission)
        if (!hasAccess) return false
    }

    return true
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
    checkPermissionsInUserOrganizationOrRelatedOrganization,
    checkOrganizationPermission,
    checkUserBelongsToOrganization,
    checkRelatedOrganizationPermission,
    queryOrganizationEmployeeFromRelatedOrganizationFor,
    queryOrganizationEmployeeFor,
    checkOrganizationsPermission,
    checkRelatedOrganizationsPermission,
    checkPermissionsInUserOrganizationsOrRelatedOrganizations,
}
