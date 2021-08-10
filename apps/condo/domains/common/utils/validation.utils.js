const validate = require('validate.js')
const nextCookies = require('next-cookies')
const { JSON_WRONG_VERSION_FORMAT_ERROR } = require('@condo/domains/common/constants/errors')
const { JSON_UNKNOWN_VERSION_ERROR } = require('@condo/domains/common/constants/errors')
const { JSON_EXPECT_OBJECT_ERROR } = require('@condo/domains/common/constants/errors')
const { REQUIRED_NO_VALUE_ERROR } = require('@condo/domains/common/constants/errors')

function hasDbFields (databaseRequired, resolvedData, existingItem, context, addFieldValidationError) {
    if (typeof resolvedData === 'undefined') throw new Error('unexpected undefined resolvedData arg')
    if (typeof existingItem === 'undefined') existingItem = {}
    let hasAllFields = true
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

function hasRequestFields (requestFields = ['dv', 'sender'], resolvedData, context, addFieldValidationError) {
    for (let field of requestFields) {
        if (!resolvedData.hasOwnProperty(field)) {
            if (context.req) {
                const cookies = nextCookies({ req: context.req } )
                if (cookies.hasOwnProperty(field)) {
                    if (field === 'dv')  resolvedData[field] = parseInt(cookies[field])
                    else resolvedData[field] = cookies[field]
                    continue
                }
            }
            addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${field}] Value is required`)
            return false
        }
    }
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
    hasDbFields,
    hasOneOfFields,
    hasRequestFields,
    hasValidJsonStructure,
}
