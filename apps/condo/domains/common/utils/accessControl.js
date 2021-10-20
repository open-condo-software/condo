const { isFunction, capitalize } = require('lodash')
const { throwForbiddenError } = require('./apolloErrorFormatter')

function accessControl (schemaType, name, schema){
    if (schema.access) {
        ['create', 'read', 'update', 'delete'].forEach(crudOperation => {
            const originalAccess = schema.access[crudOperation]
            schema.access[crudOperation] = function ({ authentication: { item: user }, operation, itemId, context } ) {
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
    return schema
}

module.exports = { accessControl }