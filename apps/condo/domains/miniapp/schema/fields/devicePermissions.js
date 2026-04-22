const { MINIAPP_DEVICE_PERMISSIONS } = require('@condo/domains/miniapp/constants')

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

function getDevicePermissionsFields () {
    return Object.fromEntries(MINIAPP_DEVICE_PERMISSIONS.map(permission => {
        const fieldName = `is${_capitalize(permission)}Allowed`
        const humanReadableName = _camelSplit(permission).join(' ').toLowerCase()
        return [fieldName, {
            ...BASE_FIELD,
            schemaDoc: BASE_FIELD.schemaDoc.replace('{permission}', humanReadableName),
        }]
    }))
}

module.exports = {
    getDevicePermissionsFields,
}