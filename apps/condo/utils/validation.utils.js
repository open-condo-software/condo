const { REQUIRED_NO_VALUE_ERROR } = require('../constants/errors')

function hasRequestAndDbFields (requestRequired, databaseRequired, resolvedData, existingItem, addFieldValidationError) {
    if (typeof resolvedData === 'undefined') throw new Error('unexpected undefined resolvedData arg')
    if (typeof existingItem === 'undefined') existingItem = {}
    let hasAllFields = true
    for (let field of requestRequired) {
        if (!resolvedData.hasOwnProperty(field)) {
            addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${field}] Value is required`)
            hasAllFields = false
        }
    }
    for (let field of databaseRequired) {
        let value = existingItem[field]
        let isValueNullOrUndefined = value === null || typeof value === 'undefined'
        if (isValueNullOrUndefined && !resolvedData.hasOwnProperty(field)) {
            addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${field}] Value is not set`)
            hasAllFields = false
        }
    }
    return hasAllFields
}

module.exports = {
    hasRequestAndDbFields,
}
