const { B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS } = require('@condo/domains/miniapp/utils/b2bAppServiceUserAccess/config')
const { generatePermissionFields } = require('@condo/domains/miniapp/utils/b2bAppServiceUserAccess/schema.utils')


const PERMISSION_FIELDS_KEYS = Object.keys(generatePermissionFields({ config: B2B_APP_SERVICE_USER_ACCESS_AVAILABLE_SCHEMAS }))


/** Get permission fields from b2bAppAccessRightSetRight, which values differs from b2bAppAccessRightSetLeft */
function getPermissionsDiff (b2bAppAccessRightSetLeft, b2bAppAccessRightSetRight) {
    const diff = {}
    for (const permissionField of PERMISSION_FIELDS_KEYS)
        if (b2bAppAccessRightSetLeft[permissionField] !== b2bAppAccessRightSetRight[permissionField]) {
            diff[permissionField] = b2bAppAccessRightSetRight[permissionField]
        }
    return diff
}

function getPermissionsWithValue (b2bAppAccessRightSet, value) {
    const output = {}
    for (const permissionField of PERMISSION_FIELDS_KEYS) {
        if (b2bAppAccessRightSet[permissionField] === value) {
            output[permissionField] = value
        }
    }
    return output
}

function getEnabledPermissions (b2bAppAccessRightSet) {
    return getPermissionsWithValue(b2bAppAccessRightSet, true)
}

function getDisabledPermissions (b2bAppAccessRightSet) {
    return getPermissionsWithValue(b2bAppAccessRightSet, false)
}

module.exports = {
    getPermissionsDiff,
    getPermissionsWithValue,
    getEnabledPermissions,
    getDisabledPermissions,
}