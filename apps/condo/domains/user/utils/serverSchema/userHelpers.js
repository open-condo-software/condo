const conf = require('@open-condo/config')


function validateUserRequiredFields (fields) {
    const supportedFields = ['email', 'phone']
    for (const field of fields) {
        if (!supportedFields.includes(field)) {
            throw new Error(`USER_REQUIRED_FIELDS supports only the listed values: ${supportedFields.join(', ')}!`)
        }
    }
}

function getIdentificationUserRequiredFields () {
    const defaultFields = ['phone']

    let userIdentificationRequiredFieldsFromEnv
    try {
        userIdentificationRequiredFieldsFromEnv = conf.IDENTIFICATION_USER_REQUIRED_FIELDS ? JSON.parse(conf.IDENTIFICATION_USER_REQUIRED_FIELDS) : null
    } catch (error) {
        throw new Error('Failed to parse USER REQUIRED_FIELDS!')
    }

    if (!userIdentificationRequiredFieldsFromEnv || !Array.isArray(userIdentificationRequiredFieldsFromEnv)) {
        return defaultFields
    }

    if (userIdentificationRequiredFieldsFromEnv.length < 1) {
        throw new Error('USER_REQUIRED_FIELDS cannot be empty!')
    }

    validateUserRequiredFields(userIdentificationRequiredFieldsFromEnv)

    return userIdentificationRequiredFieldsFromEnv
}


module.exports = {
    getIdentificationUserRequiredFields,
}
