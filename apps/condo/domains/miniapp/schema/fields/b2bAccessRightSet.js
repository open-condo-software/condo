const { B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS } = require('../../utils/b2bAppServiceUserAccess/config')
const { generatePermissionFields } = require('../../utils/b2bAppServiceUserAccess/schema.utils')

const B2B_PERMISSION_FIELDS = {
    ...generatePermissionFields({ config: B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS }),
}

module.exports = {
    B2B_PERMISSION_FIELDS,
}