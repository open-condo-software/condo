const { transformCRUDString } = require('@condo/domains/common/utils/serverSchema/accessUtils')
const { GQL_LIST_SCHEMA_TYPE, GQL_CUSTOM_SCHEMA_TYPE } = require('@core/keystone/schema')
const { get } = require('lodash')

function getFieldPermissions (user, listKey, field) {
    return transformCRUDString(get(user, ['permissions', 'lists', listKey, 'fields', field], null))
}
function getCustomPermissions (user, key) {
    return get(user, ['permissions', 'custom', key], null)
}

function perFieldAccess (schemaType, schemaName, schema) {
    if (schemaType === GQL_LIST_SCHEMA_TYPE) {
        Object.keys(schema.fields).forEach(field => {
            // field.access = true
            if (schema.fields[field].access == true) {
                const newAccessFn = function ({ authentication: { item: user }, listKey }) {
                    const fieldPermissions = getFieldPermissions(user, listKey, field)
                    if (fieldPermissions) {
                        const parsed = transformCRUDString(fieldPermissions)
                        return Object.values(parsed).every(acc => acc === true)
                    }
                    return true
                }
                schema.fields[field].access = newAccessFn.bind(schema)
            }
            else if (schema.fields[field].access != null) {
                ['create', 'read', 'update', 'delete'].forEach(operation => {
                    let newAccFn
                    // field.access[create/read/update/delete] = true
                    if (schema.fields[field].access[operation] === true) {
                        newAccFn = function ({ authentication: { item: user }, listKey }) {
                            const fieldPermissions = getFieldPermissions(user, listKey, field)
                            if (fieldPermissions) {
                                return fieldPermissions[operation] === true
                            }
                            return true
                        }
                    }
                    // field.access[create/read/update/delete] = () => boolean
                    else if (typeof schema.fields[field].access[operation] === 'function') {
                        const originalAccessFn = schema.fields[field].access[operation]
                        newAccFn = async function ({ authentication: { item: user }, listKey }) {
                            const fieldPermissions = getFieldPermissions(user, listKey, field)
                            arguments[0].permissions = fieldPermissions
                            const originalAccResult = await originalAccessFn(...arguments)
                            if (!originalAccResult) return false
                            if (fieldPermissions) {
                                return fieldPermissions[operation] === true
                            }
                            return true
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
                    if (!permissions) return false
                    return true
                }
            }
            else if (typeof custom.access === 'function') {
                const originalAccessFn = custom.access
                newAccFn = async function ({ authentication: { item: user }, gqlName }) {
                    const permissions = getCustomPermissions(user, gqlName)
                    arguments[0].permissions = permissions
                    const originalAccResult = await originalAccessFn(...arguments)
                    if (!originalAccResult || !permissions) return false
                    return true
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