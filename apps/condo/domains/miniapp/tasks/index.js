const { deleteB2BAppRoles } = require('./deleteB2BAppRoles')
const { updateB2BAppRolesPermissions } = require('./updateB2BAppRolesPermissions')
const { updateRelatedMiniappsFromOIDCClient } = require('./updateRelatedMiniappsFromOIDCClient')

module.exports = {
    deleteB2BAppRoles,
    updateB2BAppRolesPermissions,
    updateRelatedMiniappsFromOIDCClient,
}