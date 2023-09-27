const { createTask } = require('@open-condo/keystone/tasks')

const { deleteB2BAppRoles } = require('./deleteB2BAppRoles')
const { updateB2BAppRolesPermissions } = require('./updateB2BAppRolesPermissions')

module.exports = {
    deleteB2BAppRolesTask: createTask('deleteB2BAppRoles', deleteB2BAppRoles),
    updateB2BAppRolesPermissionsTask: createTask('updateB2BAppRolesPermissions', updateB2BAppRolesPermissions),
}