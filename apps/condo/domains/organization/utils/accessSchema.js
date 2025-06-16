const get = require('lodash/get')
const pick = require('lodash/pick')
const set = require('lodash/set')
const uniq = require('lodash/uniq')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { find } = require('@open-condo/keystone/schema')

const _redisClient = getKVClient('default', 'cache')
// NOTE: larger = better, but it can affect "after migration" state, where roles are changed via SQL
const DEFAULT_CACHE_TTL_IN_MS = 60 * 60 * 1000  // 1 hour in ms
const CACHE_TTL_FROM_ENV = parseInt(get(conf, 'USER_ORGANIZATION_CACHING_TTL_IN_MS'))
const CACHE_TTL_IN_MS = isNaN(CACHE_TTL_FROM_ENV) ? DEFAULT_CACHE_TTL_IN_MS : CACHE_TTL_FROM_ENV
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
        await Promise.all(cacheKeys.map(key => _redisClient.del(key)))
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
 * @property {string} roleId - user employee role id in organization
 * @property {Record<string, boolean>} permissions - user permissions in organization
 * @property {Array<string>} childOrganizations - list of child organizations to which user share permissions via OrganizationLink
 */

/**
 * Information about all organizations user has access to
 * @typedef {Object} UserOgranizationsCache
 * @property {number} dv - cache entry data version
 * @property {Record<string, UserOgranizationInfo>} organizations - record where keys are organization ids and values are info it
 * @property {Array<string> | undefined} invitations - list of IDs of organizations to which the user has been invited, but has not yet accepted or rejected
 */

/**
 * Obtains user organizations info via caching or sub-querying
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @returns {Promise<UserOgranizationsCache>}
 * @private
 */
async function _getUserOrganizations (ctx, user) {
    const cacheKey = _getUserOrganizationsCacheKey(user)
    const ctxCachePath = ['req', 'context', 'cache', cacheKey]

    if (!DISABLE_USER_ORGANIZATION_CACHING) {
        const existingRequestCache = get(ctx, ctxCachePath)

        if (existingRequestCache) {
            return existingRequestCache
        }

        const cachedDataString = await _redisClient.get(cacheKey)

        if (cachedDataString !== null) {
            const cachedOrganizations = JSON.parse(cachedDataString)
            set(ctx, ctxCachePath, cachedOrganizations)
            return cachedOrganizations
        }
    }

    /** @type UserOgranizationsCache **/
    const newCacheEntry = { dv: 1, organizations: {}, invitations: [] }

    const userEmployees = await find('OrganizationEmployee', {
        deletedAt: null,
        organization: { deletedAt: null },
        role: { deletedAt: null },
        user: { id: user.id },
        isBlocked: false,
        isRejected: false,
    })

    const userRoleIds = []
    const invitations = []

    for (const employee of userEmployees) {
        if (employee.isAccepted) {
            userRoleIds.push(employee.role)
        } else {
            invitations.push(employee.organization)
        }
    }
    newCacheEntry.invitations = invitations

    const userRoles = await find('OrganizationEmployeeRole', {
        id_in: userRoleIds,
        deletedAt: null,
    })

    for (const role of userRoles) {
        newCacheEntry.organizations[role.organization] = {
            roleId: role.id,
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
        set(ctx, ctxCachePath, newCacheEntry)
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
 * Checks if user has some of specified permissions in organizations
 * @param {Record<string, boolean>} organizationPermissions
 * @param {Array<string>} permissionsToCheck
 * @private
 */
function _checkSomePermissionsInOrganization (organizationPermissions, permissionsToCheck) {
    return permissionsToCheck.some(permission => organizationPermissions.hasOwnProperty(permission) && organizationPermissions[permission])
}


/**
 * Gets the IDs of organizations where user is employed and its employee has all permissions from the list
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} permissions - permissions to check,
 * can be passed as array of strings for multiple permissions or a single string for a single permission
 * @returns {Promise<Array<string>>}
 */
async function getEmployedOrganizationsByPermissions (ctx, user, permissions) {
    const userOrganizationsInfo = await _getUserOrganizations(ctx, user)

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
 * Gets the IDs of organizations where user is employed and its employee has some permissions from the list
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} permissions - permissions to check,
 * can be passed as array of strings for multiple permissions or a single string for a single permission
 * @returns {Promise<Array<string>>}
 */
async function getEmployedOrganizationsBySomePermissions (ctx, user, permissions) {
    const userOrganizationsInfo = await _getUserOrganizations(ctx, user)

    const permissionsToCheck = Array.isArray(permissions) ? permissions : [permissions]
    const organizationIds = []

    for (const [id, info] of Object.entries(userOrganizationsInfo.organizations)) {
        if (_checkSomePermissionsInOrganization(info.permissions, permissionsToCheck)) {
            organizationIds.push(id)
        }
    }
    return organizationIds
}

/**
 * Gets the IDs of those child (related) organizations in whose parent organizations the user is employed and has all permissions from the list.
 * Most likely you don't need to call this method directly, but use getEmployedOrganizationsByPermissions or getEmployedOrRelatedOrganizationsByPermissions
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} permissions - permissions to check,
 * can be passed as array of strings for multiple permissions or a single string for a single permission
 * @returns {Promise<Array<string>>}
 */
async function getRelatedOrganizationsByPermissions (ctx, user, permissions) {
    const userOrganizationsInfo = await _getUserOrganizations(ctx, user)

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
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} permissions - permissions to check,
 * can be passed as array of strings for multiple permissions or a single string for a single permission
 * @returns {Promise<Array<string>>}
 */
async function getEmployedOrRelatedOrganizationsByPermissions (ctx, user, permissions) {
    const userOrganizationsInfo = await _getUserOrganizations(ctx, user)

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
 * Gets the IDs of organizations to which the user is invited but not yet employed
 * You should not use this feature anywhere other than accesses to the Organization model
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @returns {Promise<Array<string>>}
 */
async function getInvitedOrganizations (ctx, user) {
    const userOrganizationsInfo = await _getUserOrganizations(ctx, user)
    return userOrganizationsInfo.invitations || []
}

/**
 * Gets the IDs of user employees roles
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @returns {Promise<Array<string>>}
 */
async function getUserEmployeesRoles (ctx, user) {
    const userOrganizationsInfo = await _getUserOrganizations(ctx, user)

    return Object.values(userOrganizationsInfo.organizations || [])
        .map(organizationInfo => organizationInfo.roleId)
        .filter(Boolean)
}

/**
 * Checks if user is employed in all listed organizations and has all correct permissions in it.
 * Both organizations and permissions can be single elements if passed as strings instead of arrays
 * This utils is faster than filtering organization ids from corresponding get<> function,
 * so use it when you don't need related organizations
 * If organizations list is empty -> no organizations to check -> return true
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} organizationIds - organizations to checks (can be passed as array of IDs or a single ID)
 * @param {Array<string> | string} permissions - permissions to check (can be passed as array or a single string)
 * @returns {Promise<boolean>}
 */
async function checkPermissionsInEmployedOrganizations (ctx, user, organizationIds, permissions) {
    const userOrganizationsInfo = await _getUserOrganizations(ctx, user)

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
 * If organizations list is empty -> no organizations to check -> return true
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} organizationIds - organizations to checks (can be passed as array of IDs or a single ID)
 * @param {Array<string> | string} permissions - permissions to check (can be passed as array or a single string)
 * @returns {Promise<boolean>}
 */
async function checkPermissionsInRelatedOrganizations (ctx, user, organizationIds, permissions) {
    const organizationsToCheck = Array.isArray(organizationIds) ? uniq(organizationIds) : [organizationIds]

    const permittedOrganizationsList = await getRelatedOrganizationsByPermissions(ctx, user, permissions)
    const permittedOrganizationsSet = new Set(permittedOrganizationsList)

    return organizationsToCheck.every(orgId => permittedOrganizationsSet.has(orgId))
}

/**
 * Combination of checkPermissionsInEmployedOrganizations and checkPermissionsInRelatedOrganizations
 * Both organizations and permissions can be single elements if passed as strings instead of arrays
 * If organizations list is empty -> no organizations to check -> return true
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} organizationIds - organizations to checks (can be passed as array of IDs or a single ID)
 * @param {Array<string> | string} permissions - permissions to check (can be passed as array or a single string)
 * @returns {Promise<boolean>}
 */
async function checkPermissionsInEmployedOrRelatedOrganizations (ctx, user, organizationIds, permissions) {
    const organizationsToCheck = Array.isArray(organizationIds) ? uniq(organizationIds) : [organizationIds]

    const permittedOrganizationsList = await getEmployedOrRelatedOrganizationsByPermissions(ctx, user, permissions)
    const permittedOrganizationsSet = new Set(permittedOrganizationsList)

    return organizationsToCheck.every(ordId => permittedOrganizationsSet.has(ordId))
}

/**
 * Checks whether the user is an employee in ALL listed organizations
 * If organizations list is empty -> no organizations to check -> return true
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} organizationIds - organizations to checks (can be passed as array of IDs or a single ID)
 * @returns {Promise<boolean>}
 */
async function checkUserEmploymentInOrganizations (ctx, user, organizationIds) {
    return await checkPermissionsInEmployedOrganizations(ctx, user, organizationIds, [])
}

/**
 * Checks whether the user is directly employed in specified organization or in any parent organization of specified organization
 * for ALL organizations in organizationIds
 * If organizations list is empty -> no organizations to check -> return true
 * @param {{ req: import('express').Request }} ctx - keystone context object
 * @param {{ id: string }} user - user object
 * @param {Array<string> | string} organizationIds - organizations to checks (can be passed as array of IDs or a single ID)
 * @returns {Promise<boolean>}
 */
async function checkUserEmploymentOrRelationToOrganization (ctx, user, organizationIds) {
    return await checkPermissionsInEmployedOrRelatedOrganizations(ctx, user, organizationIds, [])
}

/**
 * Checks if the user has the required permission to perform create or update operations
 * (both single and bulk) on entities associated with an organization.
 *
 * The entity must contain an `organization` field to extract the `organizationId`.
 *
 * @param {object} accessInput - The Keystone `AccessInput` object, containing context, user, operation type, etc.
 * @param {string} permission - The permission to check against the user's access rights.
 * @param {boolean} [checkRelatedOrganizations=false] - If true, checks permissions not only in user's organization,
 *                                                      but also in related organizations.
 * @returns {Promise<boolean>} - Returns true if the user has the required permission for all involved organizations.
 */
async function canManageEntityWithOrganization (
    accessInput,
    permission,
    checkRelatedOrganizations = false
) {
    const { authentication: { item: user }, context, originalInput, operation, itemId, itemIds, listKey } = accessInput
    const isBulkRequest = Array.isArray(originalInput)
    let organizationIds

    if (operation === 'create') {
        if (isBulkRequest) {
            organizationIds = originalInput.map(el => get(el, ['data', 'organization', 'connect', 'id']))

            if (organizationIds.filter(Boolean).length !== originalInput.length) return false
            organizationIds = uniq(organizationIds)
        } else {
            const organizationId = get(originalInput, ['organization', 'connect', 'id'])
            if (!organizationId) return false
            organizationIds = [organizationId]
        }
    } else if (operation === 'update') {
        const ids = itemIds || [itemId]
        if (ids.length !== uniq(ids).length) return false

        const items = await find(listKey, {
            id_in: ids,
            deletedAt: null,
        })
        if (items.length !== ids.length || items.some(item => !item.organization)) return false
        organizationIds = uniq(items.map(item => item.organization))
    }

    if (checkRelatedOrganizations) {
        return checkPermissionsInEmployedOrRelatedOrganizations(context, user, organizationIds, permission)
    } else {
        return checkPermissionsInEmployedOrganizations(context, user, organizationIds, permission)
    }
}

module.exports = {
    resetUserEmployeesCache,
    resetOrganizationEmployeesCache,
    getEmployedOrganizationsByPermissions,
    getEmployedOrganizationsBySomePermissions,
    getRelatedOrganizationsByPermissions,
    getEmployedOrRelatedOrganizationsByPermissions,
    getInvitedOrganizations,
    getUserEmployeesRoles,
    checkPermissionsInEmployedOrganizations,
    checkPermissionsInRelatedOrganizations,
    checkPermissionsInEmployedOrRelatedOrganizations,
    checkUserEmploymentInOrganizations,
    checkUserEmploymentOrRelationToOrganization,
    canManageEntityWithOrganization,
}
