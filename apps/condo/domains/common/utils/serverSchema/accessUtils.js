const { get } = require('lodash')

/**
 * Check whether user is support or user and it has access for requested list and fields
 * @returns {'NOT_SERVICE' | boolean}
 */
function pullServiceAccess ({ authentication: { item: user }, operation, fields, originalInput, listKey }) {
    if (!user.permissions) return 'NOT_SERVICE'
    if (!user.permissions.lists[listKey]) return false
    /*
        Example of listConfig:
    lists: {
        Organization: {
            fields: {
                __label__: 'ru',
                country: 'ru',
            }
            access: 'ru',
            where: {
                id_in: ['uud1', 'uuid2']
            }
        }
    }
    custom: {
        inviteNewOrganizationEmployee: true
    }
    */
    const listPermissions = get(user, ['permissions', 'lists', listKey])
    if (!listPermissions) return false
    
    const { access, where } = listPermissions
    // If operation restricted on list level, we do not perform this request at all
    if (!access[operation]) return false

    return where || true    
}

function transformCRUDString (crudStr) {
    const access = {
        create: false,
        read: false,
        update: false,
        delete: false,
    }
    if (crudStr.includes('c')) access.create = true
    if (crudStr.includes('r')) access.read = true
    if (crudStr.includes('u')) access.update = true
    if (crudStr.includes('d')) access.delete = true
    return access
}
module.exports = {
    pullServiceAccess,
    transformCRUDString,
}