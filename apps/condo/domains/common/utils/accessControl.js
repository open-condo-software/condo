const { isFunction } = require('lodash')

function accessControl (schemaType, name, schema){
    if (schema.access) {
        ['create', 'read', 'update', 'delete'].forEach(crudOperation => {
            const originalAccess = schema.access[crudOperation]
            schema.access[crudOperation] = function ({ authentication: { item: user } }, operation, itemId) {
                console.log('accessControl:', crudOperation, name)
                if (false) {
                    return false
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