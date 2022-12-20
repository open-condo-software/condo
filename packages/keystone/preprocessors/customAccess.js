const { getType } = require('@keystonejs/utils')
const get = require('lodash/get')

const { evaluateKeystoneAccessResult, evaluateKeystoneFieldAccessResult } = require('@open-condo/keystone/plugins/utils')
const { GQL_LIST_SCHEMA_TYPE } = require('@open-condo/keystone/schema')

const DEFAULT_PERMISSIONS = { read: false, update: false, create: false, delete: false }
const DEFAULT_FIELD_PERMISSIONS = { read: true, update: true, create: true }

/**
 *
 * @param user {Object} keystone user
 * @return {boolean}
 */
function hasDefinedPermissions (user) {
    return get(user, 'customAccess', null) !== null
}

/**
 * If there are some defined permissions for current user -> use it, otherwise return original one
 * @param user {Object} keystone user
 * @param permission {boolean} custom permission found for that user. False by default
 * @param originalAccessResult {boolean} access based on code of current schema
 * @return {*|boolean}
 */
function getResultPermission (user, permission, originalAccessResult) {
    if (hasDefinedPermissions(user)) {
        return permission === true || originalAccessResult
    }

    return originalAccessResult
}

function getListPermissions (user, listKey) {
    return get(user, ['customAccess', 'lists', listKey, 'access'], DEFAULT_PERMISSIONS)
}

function getFieldPermissions (user, listKey, field) {
    return get(user, ['customAccess', 'lists', listKey, 'fields', field], DEFAULT_FIELD_PERMISSIONS)
}

function fieldAccessWrapperIfNeeded (access, fnWrapper) {
    // NOTE: you can use the same object in many places! you don't need to wrap it twice
    if (!fnWrapper.alreadyprocessedbycustomaccessplugin) fnWrapper.alreadyprocessedbycustomaccessplugin = true

    const type = getType(access)
    if (type === 'Boolean') {
        // No need to wrap! You already have access, or you should not have it anyway!
        return access
    } else if (type === 'Function') {
        // NOTE: to prevent multiple wrapping the same function
        if (access.alreadyprocessedbycustomaccessplugin) return access
        else return fnWrapper
    } else if (type === 'AsyncFunction') {
        // NOTE: to prevent multiple wrapping the same function
        if (access.alreadyprocessedbycustomaccessplugin) return access
        else return fnWrapper
    } else if (type === 'Object') {
        const newAccess = {}
        if (typeof access.read !== 'undefined') newAccess.read = fieldAccessWrapperIfNeeded(access.read, fnWrapper)
        if (typeof access.create !== 'undefined') newAccess.create = fieldAccessWrapperIfNeeded(access.create, fnWrapper)
        if (typeof access.update !== 'undefined') newAccess.update = fieldAccessWrapperIfNeeded(access.update, fnWrapper)
        if (typeof access.delete !== 'undefined') newAccess.delete = fieldAccessWrapperIfNeeded(access.delete, fnWrapper)
        if (typeof access.auth !== 'undefined') newAccess.auth = fieldAccessWrapperIfNeeded(access.auth, fnWrapper)
        return newAccess
    }

    throw new Error(
        `fieldAccessWrapperIfNeeded(), received ${type}.`,
    )
}

const customAccessPostProcessor = (schemaType, name, schema) => {
    if (schemaType !== GQL_LIST_SCHEMA_TYPE && !name.endsWith('HistoryRecord')) return schema

    const access = schema.access

    const customListAccess = async (args) => {
        const { operation, authentication: { item: user }, listKey } = args
        const originalAccessResult = await evaluateKeystoneAccessResult(access, operation, args)

        return getResultPermission(user, getListPermissions(user, listKey)[operation], originalAccessResult)
    }

    schema.access = fieldAccessWrapperIfNeeded(access, customListAccess)

    Object.keys(schema.fields).forEach(field => {
        const fieldAccess = schema.fields[field].access

        if (fieldAccess) {
            const customFieldAccessWrapper = async (args) => {
                const { operation, authentication: { item: user }, listKey } = args
                const originalAccessResult = await evaluateKeystoneFieldAccessResult(fieldAccess, operation, args)
                return getResultPermission(user, getFieldPermissions(user, listKey, field)[operation], originalAccessResult)
            }

            const fieldCustomAccessWrapper = fieldAccessWrapperIfNeeded(fieldAccess, customFieldAccessWrapper)
            schema.fields[field].access = fieldCustomAccessWrapper
        }
    })

    return schema
}

module.exports = {
    customAccessPostProcessor,
}
