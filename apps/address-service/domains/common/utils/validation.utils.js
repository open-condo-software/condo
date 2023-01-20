const isNull = require('lodash/isNull')
const isObject = require('lodash/isObject')
const isUndefined = require('lodash/isUndefined')
const nextCookies = require('next-cookies')
const validate = require('validate.js')

const {
    JSON_WRONG_VERSION_FORMAT_ERROR,
    JSON_UNKNOWN_VERSION_ERROR,
    JSON_EXPECT_OBJECT_ERROR,
    REQUIRED_NO_VALUE_ERROR,
} = require('@condo/domains/common/constants/errors')
const { DV_FIELD_NAME, SENDER_FIELD_NAME } = require('@condo/domains/common/constants/utils')

function hasDbFields (databaseRequired, resolvedData, existingItem = {}, context, addFieldValidationError) {
    if (isUndefined(resolvedData)) throw new Error('unexpected undefined resolvedData arg')

    let hasAllFields = true

    for (let field of databaseRequired) {
        const value = existingItem[field]
        const isValueNullOrUndefined = isNull(value) || isUndefined(value)

        if (isValueNullOrUndefined && !resolvedData.hasOwnProperty(field)) {
            addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${field}] Value is not set`)
            hasAllFields = false
        }
    }

    return hasAllFields
}

// TODO: DOMA-663 research if we need this validation regexp at all
const VALID_JSON_FIELD_CONSTRAINTS_FORMAT_REGEXP = /^[a-zA-Z0-9!#$%()*+-;=,:[\]/.?@^_`{|}~]{5,42}$/
const JSON_STRUCTURE_FIELDS_CONSTRAINTS = {
    fingerprint: {
        presence: true,
        format: VALID_JSON_FIELD_CONSTRAINTS_FORMAT_REGEXP,
        length: { minimum: 5, maximum: 42 },
    },
}

function hasDvAndSenderFields (resolvedData, context, addFieldValidationError) {
    let hasDvField = true
    let hasSenderField = true

    if (!resolvedData.hasOwnProperty(DV_FIELD_NAME)) {
        hasDvField = false
        if (context.req) {
            const cookies = nextCookies({ req: context.req })

            if (cookies.hasOwnProperty(DV_FIELD_NAME)) {
                let parsed = parseInt(cookies[DV_FIELD_NAME])

                if (!isNaN(parsed)) {
                    resolvedData[DV_FIELD_NAME] = parsed
                    hasDvField = true
                }
            }
        }
    }

    if (!resolvedData.hasOwnProperty(SENDER_FIELD_NAME)) {
        hasSenderField = false
        if (context.req) {
            const cookies = nextCookies({ req: context.req })

            if (cookies.hasOwnProperty(SENDER_FIELD_NAME) && cookies[SENDER_FIELD_NAME]) {
                const isJsonStructureValid = hasValidJsonStructure(
                    {
                        resolvedData: { sender: cookies[SENDER_FIELD_NAME] },
                        fieldPath: SENDER_FIELD_NAME,
                        addFieldValidationError,
                    },
                    true,
                    1,
                    JSON_STRUCTURE_FIELDS_CONSTRAINTS
                )

                if (isJsonStructureValid) {
                    resolvedData[SENDER_FIELD_NAME] = cookies[SENDER_FIELD_NAME]
                    hasSenderField = true
                }
            }
        }
    }

    if (!hasDvField) {
        addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${DV_FIELD_NAME}] Value is required`)
    }

    if (!hasSenderField) {
        addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${SENDER_FIELD_NAME}] Value is required`)
    }

    return hasDvField && hasSenderField
}

function hasOneOfFields (requestRequired, resolvedData, existingItem = {}, addFieldValidationError) {
    let hasOneField = false

    if (isUndefined(resolvedData)) throw new Error('unexpected undefined resolvedData arg')
    if (requestRequired.length < 1) throw new Error('unexpected requestRequired list length')

    for (let field of requestRequired) {
        const value = existingItem[field]
        const newValue = resolvedData[field]
        const isValueNullOrUndefined = isNull(value) || isUndefined(value)
        const isNewValueNullOrUndefined = isNull(newValue) || isUndefined(newValue)

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

    if (!isObject(value) || isNull(value))
        return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] Expect JSON Object`)

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
    JSON_STRUCTURE_FIELDS_CONSTRAINTS,
    hasDbFields,
    hasOneOfFields,
    hasDvAndSenderFields,
    hasValidJsonStructure,
}
