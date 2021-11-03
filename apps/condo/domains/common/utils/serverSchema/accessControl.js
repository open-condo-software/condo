const { transformCRUDString } = require('@condo/domains/common/utils/serverSchema/accessUtils')
const { GQL_LIST_SCHEMA_TYPE, GQL_CUSTOM_SCHEMA_TYPE, getSchemaCtx } = require('@core/keystone/schema')
const { get } = require('lodash')
const { parseFieldAccess, parseListAccess, parseCustomAccess } = require('@keystonejs/access-control')

function getListPermissions (user, listKey) {
    return transformCRUDString(get(user, ['permissions', 'lists', listKey, 'access'], ''))
}

function getFieldPermissions (user, listKey, field) {
    return transformCRUDString(get(user, ['permissions', 'lists', listKey, 'fields', field], ''))
}

function getCustomPermissions (user, key) {
    return get(user, ['permissions', 'custom', key], null)
}

function hasDefinedPermissions (user) {
    return get(user, 'permissions') != null
}

function denyIfHasNoPermission (user, permission, originalAccessResult) {
    if (originalAccessResult === false) return false
    if (hasDefinedPermissions(user)) {
        if (permission === true) return originalAccessResult
    }
    return originalAccessResult
}

function createStaticAccessWrapper (permissionsGetter, defaultAccessValue = true, useOperationIndexing = true) {
    return function ({ authentication: { item: user }, operation }) {
        const permissions = permissionsGetter(...arguments)
        if (!useOperationIndexing) return denyIfHasNoPermission(user, permissions, defaultAccessValue) 
        return denyIfHasNoPermission(user, permissions[operation], defaultAccessValue) 
    }
}

function createDynamicAccessWrapper (permissionsGetter, originalAccessFn, useOperationIndexing = true){
    return async function ({ authentication: { item: user }, operation }) {
        const permissions = permissionsGetter(...arguments)
        arguments[0].permissions = permissions
        const originalAccessResult = await originalAccessFn(...arguments)
        if (!useOperationIndexing) return denyIfHasNoPermission(user, permissions, originalAccessResult)
        return denyIfHasNoPermission(user, permissions[operation], originalAccessResult) 
    }
}

function perListAccess (schemaType, schemaName, schema) {
    if (schemaType !== GQL_LIST_SCHEMA_TYPE) return schema

    const { keystone } = getSchemaCtx(schemaName)
    schema.access = parseListAccess({
        listKey: schemaName, 
        defaultAccess: keystone.defaultAccess.list,
        schemaNames: ['public'],
        access: schema.access,
    }).public

    Object.keys(schema.access).forEach(operation => {
        let newAccFn
        // schema.access: true
        if (schema.access[operation] === true) {
            const permissionsGetter = ({ authentication: { item: user }, listKey }) => getListPermissions(user, listKey)
            newAccFn = createStaticAccessWrapper(permissionsGetter, true)
        }
        // schema.access[create/read/update/delete]: () => boolean
        else if (typeof schema.access[operation] === 'function') {
            const originalAccessFn = schema.access[operation]
            const permissionsGetter = ({ authentication: { item: user }, listKey }) => getListPermissions(user, listKey)
            newAccFn = createDynamicAccessWrapper(permissionsGetter, originalAccessFn, true)
        }
        if (newAccFn) {
            schema.access[operation] = newAccFn
        }
    })
    return schema
}

function perFieldAccess (schemaType, schemaName, schema) {
    if (schemaType !== GQL_LIST_SCHEMA_TYPE) return schema

    const { keystone } = getSchemaCtx(schemaName)
    Object.keys(schema.fields).forEach(field => {
        // Keystone transforms accesses under the hood with following function
        schema.fields[field].access = parseFieldAccess({
            listKey: schemaName, 
            defaultAccess: keystone.defaultAccess.field,
            fieldKey: field,
            schemaNames: ['public'],
            access: schema.fields[field].access,
        }).public
        
        Object.keys(schema.fields[field].access).forEach(operation => {
            let newAccFn
            // field.access[create/read/update]: true
            if (schema.fields[field].access[operation] === true) {
                const permissionsGetter = ({ authentication: { item: user }, listKey }) => getFieldPermissions(user, listKey, field)
                newAccFn = createStaticAccessWrapper(permissionsGetter, true)
            }
            // field.access[create/read/update]: () => boolean
            else if (typeof schema.fields[field].access[operation] === 'function') {
                const originalAccessFn = schema.fields[field].access[operation]
                const permissionsGetter = ({ authentication: { item: user }, listKey }) => getFieldPermissions(user, listKey, field)
                newAccFn = createDynamicAccessWrapper(permissionsGetter, originalAccessFn, true)
            }
            if (newAccFn) {
                schema.fields[field].access[operation] = newAccFn
            }
        }) 
    })
    return schema
}

function perCustomAccess (schemaType, schemaName, schema) {
    if (schemaType !== GQL_CUSTOM_SCHEMA_TYPE) return schema

    const customs = (schema.queries || []).concat(schema.mutations || [])
    const { keystone } = getSchemaCtx(schemaName)
    customs.forEach((custom) => {
        custom.access = parseCustomAccess({
            defaultAccess: keystone.defaultAccess.custom,
            schemaNames: ['public'],
            access: custom.access,
        }).public

        let newAccFn
        // [mutation/query].access: true
        if (custom.access === true) {
            const permissionsGetter = ({ authentication: { item: user }, gqlName }) => getCustomPermissions(user, gqlName)
            newAccFn = createStaticAccessWrapper(permissionsGetter, true, false)
        }
        // [mutation/query].access: () => boolean
        else if (typeof custom.access === 'function') {
            const originalAccessFn = custom.access
            const permissionsGetter = ({ authentication: { item: user }, gqlName }) => getCustomPermissions(user, gqlName)
            newAccFn = createDynamicAccessWrapper(permissionsGetter, originalAccessFn, false)
        }
        if (newAccFn) {
            custom.access = newAccFn
        }
    })
    return schema
}

// For mote information about cases, see: https://v5.keystonejs.com/api/access-control#list-level-access-control

module.exports = { perListAccess, perFieldAccess, perCustomAccess }