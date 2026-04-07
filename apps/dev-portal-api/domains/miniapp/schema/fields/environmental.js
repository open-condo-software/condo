const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')

function _capitalize (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}



function getEnvironmentalFields (fieldName, field) {
    return Object.fromEntries(
        AVAILABLE_ENVIRONMENTS.map(environment => [getEnvironmentalFieldName(environment, fieldName), {
            ...field,
            schemaDoc: field.schemaDoc?.replaceAll('{environment}', environment),
            adminDoc: field.adminDoc?.replaceAll('{environment}', environment),
        }])
    )
}

function getEnvironmentalFieldsSelection (fields) {
    const result = []
    for (const fieldName of fields) {
        for (const environment of AVAILABLE_ENVIRONMENTS) {
            result.push(getEnvironmentalFieldName(environment, fieldName))
        }
    }

    return result.join(' ')
}

function getEnvironmentalFieldName (environment, fieldName) {
    return `${environment}${_capitalize(fieldName)}`
}

module.exports = {
    getEnvironmentalFields,
    getEnvironmentalFieldsSelection,
    getEnvironmentalFieldName,
}
