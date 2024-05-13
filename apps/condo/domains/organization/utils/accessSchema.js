const get = require('lodash/get')
const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')
const pick = require('lodash/pick')
const uniq = require('lodash/uniq')
const { validate: isUUID } = require('uuid')

const conf = require('@open-condo/config')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getByCondition, find } = require('@open-condo/keystone/schema')

const _redisClient = getRedisClient('default', 'cache')
// NOTE: larger = better, but it can affect "after migration" state, where roles are changed via SQL
const CACHE_TTL_IN_MS = 60 * 60 * 1000  // 1 hour in ms
const DISABLE_USER_ORGANIZATION_CACHING = get(conf, 'DISABLE_USER_ORGANIZATION_CACHING', 'false').toLowerCase() === 'true'

/**
 * Gets cache key for user
 * Pattern cache:organizations:* can be used to select all cached keys to drop in some critical migration states
 * @param {{ id: string }} user - user object
 * @returns {string} - caching key
 */
function _getUserOrganizationsCacheKey (user) {
    return `cache:organizations:user:${user.id}`
}

/**
 * Extracts permissions (canRead*, canManage*) properties from OrganizationEmployeeRole record obtained by find
 * @param {Record<string, unknown>} roleRecord
 * @returns {Record<string, boolean>}
 * @private
 */
function _extractRolePermissions (roleRecord) {
    const permissionKeys = Object.keys(roleRecord).filter(key => key.startsWith('can'))

    return pick(roleRecord, permissionKeys)
}

/**
 * Information about single organization, in which user is employed, and its child organizations
 * @typedef {Object} UserOgranizationInfo
 * @property {Record<string, boolean>} permissions - user permissions in organization
 * @property {Array<string>} childOrganizations - list of child organizations to which user share permissions via OrganizationLink
 */

/**
 * Information about all organizations user has access to
 * @typedef {Object} UserOgranizationsCache
 * @property {number} dv - cache entry data version
 * @property {Record<string, UserOgranizationInfo>} organizations - record where keys are organization ids and values are info it
 */

/**
 * Obtains user organizations info via caching or sub-querying
 * @param {{ id: string }} user - user object
 * @returns {Promise<UserOgranizationsCache>}
 * @private
 */
async function _getUserOrganizations (user) {
    const cacheKey = _getUserOrganizationsCacheKey(user)

    if (!DISABLE_USER_ORGANIZATION_CACHING) {
        const cachedDataString = await _redisClient.get(cacheKey)

        if (cachedDataString !== null) {
            return JSON.parse(cachedDataString)
        }
    }

    const newCacheEntry = { dv: 1, organizations: {} }

    const userEmployees = await find('OrganizationEmployee', {
        deletedAt: null,
        organization: { deletedAt: null },
        user: { id: user.id },
        isAccepted: true,
        isBlocked: false,
        isRejected: false,
    })

    const userRoleIds = userEmployees.map(employee => employee.role)
    const userRoles = await find('OrganizationEmployee', {
        id_in: userRoleIds,
        deletedAt: null,
    })

    for (const role of userRoles) {
        newCacheEntry.organizations[role.organization] = {
            permissions: _extractRolePermissions(role),
            childOrganizations: [],
        }
    }

    const organizationLinks = await find('OrganizationLink', {
        from: { id_in: Object.keys(newCacheEntry.organizations) },
        deletedAt: null,
        to: { deletedAt: null },
    })

    for (const link of organizationLinks) {
        newCacheEntry.organizations[link.from].childOrganizations.push(link.to)
    }

    if (!DISABLE_USER_ORGANIZATION_CACHING) {
        await _redisClient.set(cacheKey, JSON.stringify(newCacheEntry), 'PX', CACHE_TTL_IN_MS)
    }

    return newCacheEntry
}


async function checkOrganizationPermission (userId, organizationId, permission) {
    return checkOrganizationPermissions(userId, organizationId, [permission])
}

/**
 * @param {string} userId
 * @param {string} organizationId
 * @param {string[]} permissions
 * @return {Promise<boolean>}
 */
async function checkOrganizationPermissions (userId, organizationId, permissions) {
    if (!userId || !organizationId) return false
    const [employee] = await find('OrganizationEmployee', {
        organization: { id: organizationId },
        user: { id: userId },
        deletedAt: null,
        isBlocked: false,
    })

    if (isEmpty(permissions) && employee) {
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
    return permissions.every((permission) => !!employeeRole[permission]) || false
}

async function checkRelatedOrganizationPermission (userId, organizationId, permission) {
    return checkRelatedOrganizationPermissions(userId, organizationId, [permission])
}

/**
 * @param {string} userId
 * @param {string} organizationId
 * @param {string[]} permissions
 * @return {Promise<boolean>}
 */
async function checkRelatedOrganizationPermissions (userId, organizationId, permissions) {
    if (!userId || !organizationId) return false
    const [organizationLink] = await find('OrganizationLink', {
        from: queryOrganizationEmployeeFor(userId),
        to: { id: organizationId },
        deletedAt: null,
    })
    if (!organizationLink) return false

    return checkOrganizationPermissions(userId, organizationLink.from, permissions)
}

// TODO(nomerdvadcatpyat): use this function where checkRelatedOrganizationPermission and checkOrganizationPermission used together
async function checkPermissionInUserOrganizationOrRelatedOrganization (userId, organizationId, permission) {
    return checkPermissionsInUserOrganizationOrRelatedOrganization(userId, organizationId, [permission])
}

/**
 * @param {string} userId
 * @param {string} organizationId
 * @param {string[]} permissions
 * @return {Promise<boolean>}
 */
async function checkPermissionsInUserOrganizationOrRelatedOrganization (userId, organizationId, permissions) {
    if (!userId || !organizationId) return false

    const hasPermissionsInUserOrganization = await checkOrganizationPermissions(userId, organizationId, permissions)
    if (hasPermissionsInUserOrganization) return true
    return await checkRelatedOrganizationPermissions(userId, organizationId, permissions)
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

async function checkUserBelongsToRelatedOrganization (userId, organizationId) {
    if (!userId || !organizationId) return false
    const [organizationLink] = await find('OrganizationLink', {
        from: queryOrganizationEmployeeFor(userId),
        to: { id: organizationId },
        deletedAt: null,
    })
    if (!organizationLink) return false

    return checkUserBelongsToOrganization(userId, organizationLink.from)
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
    checkUserBelongsToRelatedOrganization,
    checkRelatedOrganizationPermission,
    queryOrganizationEmployeeFromRelatedOrganizationFor,
    queryOrganizationEmployeeFor,
    checkOrganizationsPermission,
    checkRelatedOrganizationsPermission,
    checkPermissionsInUserOrganizationsOrRelatedOrganizations,
}
