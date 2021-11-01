
const { parseCRUDAccess } = require('@condo/domains/common/utils/serverSchema/accessUtils')

function perFieldAccess (schemaType, schemaName, schema, keystone) {
    if (schemaType === 'GQLListSchema') {
        Object.keys(schema.fields).forEach(field => {
            // field.access = true
            if (schema.fields[field].access == true) {
                const newAccessFn = function ({ authentication: { item: user, listKey } }) {
                    if (user && user.permissions) {
                        if (!user.permissions[listKey]) return false
                        if (!user.permissions[listKey].fields[field]) return false
                        const permissions = parseCRUDAccess(user.permissions[listKey])
                        return Object.values(permissions.fields[field]).every(acc => acc === true)
                    }
                    else return schema.fields[field].access
                }
                schema.fields[field].access = newAccessFn.bind(schema)
            }
            else if (schema.fields[field].access != null) {
                ['create', 'read', 'update', 'delete'].forEach(operation => {
                    let newAccFn

                    // field.access[create/read/update/delete] = true
                    if (schema.fields[field].access[operation] === true) {
                        newAccFn = function ({ authentication: { item: user, listKey } }) {
                            if (user && user.permissions) {
                                if (!user.permissions[listKey]) return false
                                const permissions = parseCRUDAccess(user.permissions[listKey])
                                return permissions.fields[field][operation] === true
                            }
                            else return keystone.defaultAccess.field
                        }
                    }
                    // field.access[create/read/update/delete] = () => boolean
                    else if (typeof schema.fields[field].access[operation] === 'function') {
                        const originalAccessFn = schema.fields[field].access[operation]
                        newAccFn = function ({ authentication: { item: user, listKey } }) {
                            const originalAccResult = originalAccessFn(...arguments)
                            if (!originalAccResult) return false
                            if (user && user.permissions) {
                                if (!user.permissions[listKey]) return false
                                const permissions = parseCRUDAccess(user.permissions[listKey])
                                return permissions.fields[field][operation] === true
                            }
                            return true
                        }
                    }
                    if (newAccFn)
                        schema.fields[field].access[operation] = newAccFn.bind(schema)
                })
            }
        })
    }
    else if (schemaType === 'GQLCustomSchema' && schema.mutations) {
        // TODO
    }
    return schema
}
module.exports = { perFieldAccess }