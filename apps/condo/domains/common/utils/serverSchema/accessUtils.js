/**
 * Check whether user is support or user and it has access for requested list and fields
 * @returns {'NOT_SERVICE' | boolean}
 */
function pullServiceAccess ({ authentication: { item: user }, operation, fields, originalInput, listKey }) {
    if (!user.permissions) return 'NOT_SERVICE'
    if (!user.permissions[listKey]) return false
    /*
        Example of listConfig:

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
    */
    const { access: listAccess, where: listWhere } = parseCRUDAccess(user.permissions[listKey])

    // If operation restricted on list level, we do not perform this request at all
    if (!listAccess[operation]) return false

    // if (operation !== 'delete') {
    //     for (const reqField of fields) {
    //         if (!listFields[reqField] || !listFields[reqField][operation]) {
    //             return false
    //         }
    //     }
    // }  

    // We are not checking delete operation, cause it available only on list field
    return listWhere || true    
}

function parseCRUDAccess (accessConfig) {
    Object.keys(accessConfig.fields).forEach(field => {
        accessConfig.fields[field] = parseCRUDString(accessConfig.fields[field])
    })
    accessConfig.access = parseCRUDString(accessConfig.access)
    return accessConfig
}

function parseCRUDString (crudStr) {
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
    parseCRUDAccess,
}