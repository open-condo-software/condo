const get = require('lodash/get')
const pick = require('lodash/pick')
const uniq = require('lodash/uniq')

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
 * Clear cache data for all users employed in organization
 * @param {string} organizationId - id of target organization
 * @param {string | undefined} roleId - filter employees by roles
 * @returns {Promise<void>}
 */
async function resetOrganizationEmployeesCache (organizationId, roleId = undefined) {
    const employeesFilter = {
        deletedAt: null,
        organization: { id: organizationId },
    }
    if (roleId) {
        employeesFilter.role = { id: roleId }
    }

    const employees = await find('OrganizationEmployee', employeesFilter)

    if (employees.length) {
        const cacheKeys = employees.map(employee => _getUserOrganizationsCacheKey({ id: employee.user }))
        await _redisClient.del(cacheKeys)
    }
}

/**
 * Clear cache data for specified user
 * @param {string} userId
 * @returns {Promise<void>}
 */
async function resetUserEmployeesCache (userId) {
    const cacheKey = _getUserOrganizationsCacheKey({ id: userId })
    await _redisClient.del(cacheKey)
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
    const userRoles = await find('OrganizationEmployeeRole', {
        id_in: userRoleIds,
        // TODO(SavelevMatthew): INFRA-317 Add this check
        // deletedAt: null,
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

/**
 * Checks if user have all specified permissions in organizations
 * @param {Record<string, boolean>} organizationPermissions
 * @param {Array<string>} permissionsToCheck
 * @private
 */
function _checkPermissionsInOrganization (organizationPermissions, permissionsToCheck) {
    return permissionsToCheck.every(permission => organizationPermissions.hasOwnProperty(permission) && organizationPermissions[permission])
}

/**
 * Gets the IDs of organizations where user is employed and its employee has all permissions from the list
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} permissions - permissions to check,
 * can be passed as array of strings for multiple permissions or a single string for a single permission
 * @returns {Promise<Array<string>>}
 */
async function getEmployedOrganizationsByPermissions (user, permissions) {
    const userOrganizationsInfo = await _getUserOrganizations(user)

    const permissionsToCheck = Array.isArray(permissions) ? permissions : [permissions]
    const organizationIds = []

    for (const [id, info] of Object.entries(userOrganizationsInfo.organizations)) {
        if (_checkPermissionsInOrganization(info.permissions, permissionsToCheck)) {
            organizationIds.push(id)
        }
    }
    return organizationIds
}

/**
 * Gets the IDs of those child (related) organizations in whose parent organizations the user is employed and has all permissions from the list.
 * Most likely you don't need to call this method directly, but use getEmployedOrganizationsByPermissions or getEmployedOrRelatedOrganizationsByPermissions
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} permissions - permissions to check,
 * can be passed as array of strings for multiple permissions or a single string for a single permission
 * @returns {Promise<Array<string>>}
 */
async function getRelatedOrganizationsByPermissions (user, permissions) {
    const userOrganizationsInfo = await _getUserOrganizations(user)

    const permissionsToCheck = Array.isArray(permissions) ? permissions : [permissions]
    const organizationIds = []

    for (const info of Object.values(userOrganizationsInfo.organizations)) {
        if (_checkPermissionsInOrganization(info.permissions, permissionsToCheck)) {
            organizationIds.push(...info.childOrganizations)
        }
    }
    return uniq(organizationIds)
}

/**
 * Gets the IDs of organizations and its child (related) organizations in whose parent organizations the user is employed and has all permissions from the list.
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} permissions - permissions to check,
 * can be passed as array of strings for multiple permissions or a single string for a single permission
 * @returns {Promise<Array<string>>}
 */
async function getEmployedOrRelatedOrganizationsByPermissions (user, permissions) {
    const userOrganizationsInfo = await _getUserOrganizations(user)

    const permissionsToCheck = Array.isArray(permissions) ? permissions : [permissions]
    const organizationIds = []

    for (const [id, info] of Object.entries(userOrganizationsInfo.organizations)) {
        if (_checkPermissionsInOrganization(info.permissions, permissionsToCheck)) {
            organizationIds.push(id, ...info.childOrganizations)
        }
    }
    return uniq(organizationIds)
}

/**
 * Checks if user is employed in all listed organizations and has all correct permissions in it.
 * Both organizations and permissions can be single elements if passed as strings instead of arrays
 * This utils is faster than filtering organization ids from corresponding get<> function,
 * so use it when you don't need related organizations
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} organizationIds - organizations to checks (can be passed as array of IDs or a single ID)
 * @param {Array<string> | string} permissions - permissions to check (can be passed as array or a single string)
 * @returns {Promise<boolean>}
 */
async function checkPermissionsInEmployedOrganizations (user, organizationIds, permissions) {
    const userOrganizationsInfo = await _getUserOrganizations(user)

    const organizationsToCheck = Array.isArray(organizationIds) ? uniq(organizationIds) : [organizationIds]
    const permissionsToCheck = Array.isArray(permissions) ? permissions : [permissions]

    return organizationsToCheck.every(orgId =>
        userOrganizationsInfo.organizations.hasOwnProperty(orgId) &&
        _checkPermissionsInOrganization(
            userOrganizationsInfo.organizations[orgId].permissions,
            permissionsToCheck
        )
    )
}

/**
 * Checks if user is employed in some parent organization for all listed organizations and has all correct permissions in it.
 * Both organizations and permissions can be single elements if passed as strings instead of arrays
 * Most likely you don't need to call this method directly, but use checkPermissionsInEmployedOrganizations or checkPermissionsInEmployedOrRelatedOrganizations
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} organizationIds - organizations to checks (can be passed as array of IDs or a single ID)
 * @param {Array<string> | string} permissions - permissions to check (can be passed as array or a single string)
 * @returns {Promise<boolean>}
 */
async function checkPermissionsInRelatedOrganizations (user, organizationIds, permissions) {
    const organizationsToCheck = Array.isArray(organizationIds) ? uniq(organizationIds) : [organizationIds]

    const permittedOrganizationsList = await getRelatedOrganizationsByPermissions(user, permissions)
    const permittedOrganizationsSet = new Set(permittedOrganizationsList)

    return organizationsToCheck.every(orgId => permittedOrganizationsSet.has(orgId))
}

/**
 * Combination of checkPermissionsInEmployedOrganizations and checkPermissionsInRelatedOrganizations
 * Both organizations and permissions can be single elements if passed as strings instead of arrays
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} organizationIds - organizations to checks (can be passed as array of IDs or a single ID)
 * @param {Array<string> | string} permissions - permissions to check (can be passed as array or a single string)
 * @returns {Promise<boolean>}
 */
async function checkPermissionsInEmployedOrRelatedOrganizations (user, organizationIds, permissions) {
    const organizationsToCheck = Array.isArray(organizationIds) ? uniq(organizationIds) : [organizationIds]

    const permittedOrganizationsList = await getEmployedOrRelatedOrganizationsByPermissions(user, permissions)
    const permittedOrganizationsSet = new Set(permittedOrganizationsList)

    return organizationsToCheck.every(ordId => permittedOrganizationsSet.has(ordId))
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

module.exports = {
    // New utils
    resetUserEmployeesCache,
    resetOrganizationEmployeesCache,
    getEmployedOrganizationsByPermissions,
    getRelatedOrganizationsByPermissions,
    getEmployedOrRelatedOrganizationsByPermissions,
    checkPermissionsInEmployedOrganizations,
    checkPermissionsInRelatedOrganizations,
    checkPermissionsInEmployedOrRelatedOrganizations,
    // Old utils
    // TODO(INFRA-317): Remove this one-by-one
    checkUserBelongsToOrganization,
    checkUserBelongsToRelatedOrganization,
    queryOrganizationEmployeeFromRelatedOrganizationFor,
    queryOrganizationEmployeeFor,
}
