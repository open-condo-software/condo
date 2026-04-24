const { MINIAPP_DEVICE_PERMISSIONS } = require('@condo/domains/miniapp/constants')
const { getDevicePermissionsFields, getDevicePermissionFieldName } = require('@condo/domains/miniapp/schema/fields/devicePermissions')
const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')

const { getEnvironmentalFields, getEnvironmentalFieldName } = require('./environmental')

function _getEnvironmentalNameFromCondoFormat (environment, condoFieldName) {
    const fieldName = condoFieldName.slice(2) // remove 'is' prefix

    return getEnvironmentalFieldName(environment, fieldName)
}

function getEnvironmentalPermissionsFieldsSelection () {
    const result = []
    for (const permission of MINIAPP_DEVICE_PERMISSIONS) {
        for (const environment of AVAILABLE_ENVIRONMENTS) {
            const condoFieldName = getDevicePermissionFieldName(permission)
            const portalFieldName = _getEnvironmentalNameFromCondoFormat(environment, condoFieldName)
            result.push(portalFieldName)
        }
    }
    return result.join(' ')
}

function getEnvironmentalPermissionsFields () {
    const commonFields = getDevicePermissionsFields()

    return Object.assign({}, ...Object.entries(commonFields).map(([name, field]) => {
        const fieldName = name.slice(2) // remove 'is' prefix

        return getEnvironmentalFields(fieldName, {
            ...field,
            schemaDoc: field.schemaDoc + ' on {environment} environment',
        })
    }))
}

function extractDevicePermissionsForCondo (devPortalApp, environment) {
    const condoFields = {}

    for (const permission of MINIAPP_DEVICE_PERMISSIONS) {
        const condoFieldName = getDevicePermissionFieldName(permission)
        const portalFieldName = _getEnvironmentalNameFromCondoFormat(environment, condoFieldName)
        if (Object.hasOwn(devPortalApp, portalFieldName)) {
            condoFields[condoFieldName] = devPortalApp[portalFieldName]
        }
    }

    return condoFields
}

module.exports = {
    getEnvironmentalPermissionsFields,
    extractDevicePermissionsForCondo,
    getEnvironmentalPermissionsFieldsSelection,
}
