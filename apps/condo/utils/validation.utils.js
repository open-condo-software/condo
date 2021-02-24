const validate = require('validate.js')

const { JSON_WRONG_VERSION_FORMAT_ERROR } = require('../constants/errors')
const { JSON_UNKNOWN_VERSION_ERROR } = require('../constants/errors')
const { JSON_EXPECT_OBJECT_ERROR } = require('../constants/errors')
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

function hasOneOfFields (requestRequired, resolvedData, existingItem, addFieldValidationError) {
    if (typeof resolvedData === 'undefined') throw new Error('unexpected undefined resolvedData arg')
    if (requestRequired.length < 1) throw new Error('unexpected requestRequired list length')
    if (typeof existingItem === 'undefined') existingItem = {}
    let hasOneField = false
    for (let field of requestRequired) {
        let value = existingItem[field]
        let newValue = resolvedData[field]
        let isValueNullOrUndefined = value === null || typeof value === 'undefined'
        let isNewValueNullOrUndefined = newValue === null || typeof newValue === 'undefined'
        if (!isValueNullOrUndefined || !isNewValueNullOrUndefined) hasOneField = true
    }

    if (!hasOneField) addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${requestRequired[0]}] Value is required`)
    return hasOneField
}

function hasValidJsonStructure (args, isRequired, dataVersion, fieldsConstraints) {
    const { resolvedData, fieldPath, addFieldValidationError } = args
    if (isRequired && !resolvedData.hasOwnProperty(fieldPath)) {
        addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${fieldPath}] Value is required`)
        return false
    }
    const value = resolvedData[fieldPath]
    if (typeof value !== 'object' || value === null) return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] Expect JSON Object`)
    const { dv, ...data } = value
    if (dv === dataVersion) {
        const errors = validate(data, fieldsConstraints)
        if (errors) {
            for (const name of Object.keys(errors)) {
                for (const err of errors[name]) {
                    addFieldValidationError(`${JSON_WRONG_VERSION_FORMAT_ERROR}${fieldPath}] Field '${name}': ${err}`)
                }
            }
        }
        return !errors
    } else {
        return addFieldValidationError(`${JSON_UNKNOWN_VERSION_ERROR}${fieldPath}] Unknown \`dv\` attr inside JSON Object`)
    }
}

module.exports = {
    hasRequestAndDbFields,
    hasOneOfFields,
    hasValidJsonStructure,
}
