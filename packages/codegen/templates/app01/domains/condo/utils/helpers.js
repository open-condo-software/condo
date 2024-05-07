const isArray = require('lodash/isArray')
const isObject = require('lodash/isObject')


const hasAllRequiredPermissions = (permissions, requiredPermissions = []) => {
    if (!isArray(requiredPermissions)) throw new Error('requiredPermissions must be array!')
    if (!isObject(permissions)) return false

    for (const requiredPermission of requiredPermissions) {
        if (permissions[requiredPermission] !== true) {
            return false
        }
    }

    return true
}


module.exports = {
    hasAllRequiredPermissions,
}
