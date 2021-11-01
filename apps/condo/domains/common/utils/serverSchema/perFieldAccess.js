const { transformCRUDString } = require('@condo/domains/common/utils/serverSchema/accessUtils')
const { GQL_LIST_SCHEMA_TYPE, GQL_CUSTOM_SCHEMA_TYPE, getSchemaCtx } = require('@core/keystone/schema')
const { get } = require('lodash')

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
    if (!originalAccessResult) return false
    if (hasDefinedPermissions(user)) {
        return permission === true
    }
    return true
}

function perFieldAccess (schemaType, schemaName, schema) {
    if (schemaType === GQL_LIST_SCHEMA_TYPE) {
        Object.keys(schema.fields).forEach(field => {
            // field.access = true
            if (schema.fields[field].access == true) {
                const newAccessFn = function ({ authentication: { item: user }, listKey, operation }) {
                    const permissions = getFieldPermissions(user, listKey, field)
                    return denyIfHasNoPermission(user, permissions[operation], true)
                }
                schema.fields[field].access = newAccessFn.bind(schema)
            }
            else if (schema.fields[field].access != null) {
                ['create', 'read', 'update'].forEach(operation => {
                    let newAccFn
                    // field.access[create/read/update] = true
                    // even if undefined we are binding new access function, 
                    // because defaultAccess to field in keystone set as 'true'
                    const { keystone } = getSchemaCtx(schemaName)
                    if (schema.fields[field].access[operation] === true || (keystone.defaultAccess.field === true && schema.fields[field].access[operation] === undefined)) {
                        newAccFn = function ({ authentication: { item: user }, listKey }) {
                            const permissions = getFieldPermissions(user, listKey, field)
                            return denyIfHasNoPermission(user, permissions[operation], true)
                        }
                    }
                    // field.access[create/read/update/delete] = () => boolean
                    else if (typeof schema.fields[field].access[operation] === 'function') {
                        const originalAccessFn = schema.fields[field].access[operation]
                        newAccFn = async function ({ authentication: { item: user }, listKey }) {
                            const permissions = getFieldPermissions(user, listKey, field)
                            arguments[0].permissions = permissions
                            const originalAccResult = await originalAccessFn(...arguments)
                            return denyIfHasNoPermission(user, permissions[operation], originalAccResult)
                        }
                    }
                    if (newAccFn) {
                        schema.fields[field].access[operation] = newAccFn.bind(schema)
                    }
                })
            }
        })
    }
    else if (schemaType === GQL_CUSTOM_SCHEMA_TYPE) {
        const customs = (schema.queries || []).concat(schema.mutations || [])
        
        customs.forEach((custom) => {
            let newAccFn
            // mutation.access: true
            if (custom.access === true) {
                newAccFn = function ({ authentication: { item: user }, gqlName }) {
                    const permissions = getCustomPermissions(user, gqlName)
                    return denyIfHasNoPermission(user, permissions, true)
                }
            }
            else if (typeof custom.access === 'function') {
                const originalAccessFn = custom.access
                newAccFn = async function ({ authentication: { item: user }, gqlName }) {
                    const permissions = getCustomPermissions(user, gqlName)
                    arguments[0].permissions = permissions
                    const originalAccResult = await originalAccessFn(...arguments)
                    return denyIfHasNoPermission(user, permissions, originalAccResult)
                }
            }
            if (newAccFn) {
                custom.access = newAccFn.bind(schema)
            }
        })
    }
    return schema
}
module.exports = { perFieldAccess }