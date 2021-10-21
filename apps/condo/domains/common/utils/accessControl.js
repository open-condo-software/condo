const gql = require('graphql-tag')
const { upperFirst, isUndefined, isNull, isBoolean } = require('lodash')
const { isObject } = require('validate.js')
const { throwForbiddenError } = require('./apolloErrorFormatter')

function accessControl (schemaType, schemaName, schema) {
    if (schemaType === 'GQLListSchema' && isObject(schema.access)) {
        Object.getOwnPropertyNames(schema.access).forEach(crudOperation => {
            const originalAccess = schema.access[crudOperation]
            if (isBoolean(originalAccess)) {
                return
            }
            schema.access[crudOperation] = function ({ authentication: { item: user } } ) {
                if (user && user.permissions) {
                    const thisPermissionName = `can${upperFirst(crudOperation)}${schemaName}s`
                    if (user.permissions[thisPermissionName] !== true) {
                        return throwForbiddenError()
                    }
                    else {
                        return true
                    }
                }
                return originalAccess(...arguments)
            }
        })
    }
    else if (schemaType === 'GQLCustomSchema' && schema.mutations) {
        schema.mutations.forEach(mutation => {
            const gqlMutationSchema = gql('type A { ' + mutation.schema + ' }')
            const mutationName = gqlMutationSchema.definitions[0].fields[0].name.value
            const permissionName = `can${upperFirst(mutationName)}`
            if (!isNull(mutation.access) && !isUndefined(mutation.access)) {
                const originalAccess = mutation.access
                if (isBoolean(originalAccess)) {
                    return
                }
                mutation.access = function ({ authentication: { item: user } }){
                    if (user && user.permissions) {
                        if (user.permissions[permissionName] !== true) {
                            return throwForbiddenError()
                        }
                        else {
                            return true
                        }
                    }
                    return originalAccess(...arguments)
                }
            }
        })
    }
    return schema
}

module.exports = { accessControl }