const { B2B_PERMISSION_FIELDS } = require('@condo/domains/miniapp/schema/fields/b2bAccessRightSet')

const PERMISSION_FIELDS_KEYS = Object.keys(B2B_PERMISSION_FIELDS)

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