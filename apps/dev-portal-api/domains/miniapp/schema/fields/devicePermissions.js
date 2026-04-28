const { getDevicePermissionsFields, getDevicePermissionFieldName, getDevicePermissions } = require('@condo/domains/miniapp/schema/fields/devicePermissions')
const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')

const { getEnvironmentalFields, getEnvironmentalFieldName } = require('./environmental')

function _getEnvironmentalNameFromCondoFormat (environment, condoFieldName) {
    const fieldName = condoFieldName.slice(2) // remove 'is' prefix

    return getEnvironmentalFieldName(environment, fieldName)
}

function getEnvironmentalPermissionsFieldsSelection ({ listKey }) {
    const result = []
    const permissions = getDevicePermissions({ listKey })
    for (const permission of permissions) {
        for (const environment of AVAILABLE_ENVIRONMENTS) {
            const condoFieldName = getDevicePermissionFieldName(permission)
            const portalFieldName = _getEnvironmentalNameFromCondoFormat(environment, condoFieldName)
            result.push(portalFieldName)
        }
    }
    return result.join(' ')
}

function getEnvironmentalPermissionsFields ({ listKey }) {
    const commonFields = getDevicePermissionsFields({ listKey })

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
    const allPermissions = getDevicePermissions()

    for (const permission of allPermissions) {
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
