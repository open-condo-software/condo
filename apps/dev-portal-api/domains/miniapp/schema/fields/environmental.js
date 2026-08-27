const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')

function _capitalize (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}



function getEnvironmentalFields (fieldName, field) {
    const fieldFn = typeof field === 'function' ? field : () => field

    return Object.fromEntries(
        AVAILABLE_ENVIRONMENTS.map(environment => {
            const environmentalFieldName = getEnvironmentalFieldName(environment, fieldName)
            const environmentalField = fieldFn(environment)

            return [environmentalFieldName, {
                ...environmentalField,
                schemaDoc: environmentalField.schemaDoc?.replaceAll('{environment}', environment),
                adminDoc: environmentalField.adminDoc?.replaceAll('{environment}', environment),
            }]
        })
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
