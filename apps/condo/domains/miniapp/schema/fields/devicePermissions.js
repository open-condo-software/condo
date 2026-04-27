const { B2C_APP_DEVICE_PERMISSIONS, B2B_APP_DEVICE_PERMISSIONS } = require('@condo/domains/miniapp/constants')

const BASE_FIELD = {
    schemaDoc: 'Controls whether the mini-app can use “{permission}” device permission',
    type: 'Checkbox',
    defaultValue: false,
    isRequired: true,
    sensitive: false,
}

function _camelSplit (str) {
    return str.split(/(?=[A-Z])/)
}

function _capitalize (str) {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

function getDevicePermissionFieldName (permission) {
    return `is${_capitalize(permission)}Allowed`
}

function getDevicePermissions ({ listKey } = {}) {
    if (listKey === 'B2CApp') return B2C_APP_DEVICE_PERMISSIONS
    else if (listKey === 'B2BApp') return B2B_APP_DEVICE_PERMISSIONS

    return [...new Set([...B2C_APP_DEVICE_PERMISSIONS, ...B2B_APP_DEVICE_PERMISSIONS])]
}

function getDevicePermissionsFields ({ listKey }) {
    const permissions = getDevicePermissions({ listKey })

    return Object.fromEntries(permissions.map(permission => {
        const fieldName = getDevicePermissionFieldName(permission)
        const humanReadableName = _camelSplit(permission).join(' ').toLowerCase()
        return [fieldName, {
            ...BASE_FIELD,
            schemaDoc: BASE_FIELD.schemaDoc.replace('{permission}', humanReadableName),
        }]
    }))
}

module.exports = {
    getDevicePermissionFieldName,
    getDevicePermissionsFields,
    getDevicePermissions,
}