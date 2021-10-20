const gql = require('graphql-tag')
const { isFunction, capitalize, isUndefined, isNull } = require('lodash')
const { throwForbiddenError } = require('./apolloErrorFormatter')

function accessControl (schemaType, name, schema){
    if (schemaType === 'GQLListSchema' && !isUndefined(schema.access) && !isNull(schema.access)) {
        ['create', 'read', 'update', 'delete'].forEach(crudOperation => {
            const originalAccess = schema.access[crudOperation]
            schema.access[crudOperation] = function ({ authentication: { item: user } } ) {
                if (user && user.permissions) {
                    const thisPermissionName = `can${capitalize(crudOperation)}${name}s`
                    if (user.permissions[thisPermissionName] !== true) {
                        return throwForbiddenError()
                    }
                    else {
                        return true
                    }
                }
                if (isFunction(originalAccess)){
                    return originalAccess(...arguments)
                }
                else 
                {
                    return originalAccess
                }
            }
        })
    }
    else if (schemaType === 'GQLCustomSchema' && schema.mutations){
        schema.mutations.forEach(mutation => {
            const gqlMutationSchemaName = gql('type A { ' + mutation.schema + ' }')
            const mutationName = gqlMutationSchemaName.definitions[0].fields[0].name.value
            const permissionName = `can${capitalize(mutationName)}`
            if (!isNull(mutation.access) && !isUndefined(mutation.access)) {
                const originalAccess = mutation.access
                mutation.access = function ({ authentication: { item: user } }){
                    if (user && user.permissions) {
                        if (user.permissions[permissionName] !== true) {
                            return throwForbiddenError()
                        }
                        else {
                            return true
                        }
                    }
                    if (isFunction(originalAccess)){
                        return originalAccess(...arguments)
                    }
                    else 
                    {
                        return originalAccess
                    }
                }
            }
        })
    }
    return schema
}

module.exports = { accessControl }