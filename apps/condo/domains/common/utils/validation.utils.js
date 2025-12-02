const { isNull, isUndefined, isObject } = require('lodash')
const z = require('zod')

const {
    JSON_WRONG_VERSION_FORMAT_ERROR,
    JSON_UNKNOWN_VERSION_ERROR,
    JSON_EXPECT_OBJECT_ERROR,
    REQUIRED_NO_VALUE_ERROR,
} = require('@condo/domains/common/constants/errors')

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

/**
 * Validates that a JSON field in the resolved data matches the expected structure and version.
 * @param {Object} args - The validation context.
 * @param {Object} args.resolvedData - The input data object containing the field to validate.
 * @param {string} args.fieldPath - The key in `resolvedData` to validate (e.g., 'sender').
 * @param {Function} args.addFieldValidationError - Callback to report validation errors (receives error message string).
 * @param {boolean} isRequired - Whether the field must be present in `resolvedData`.
 * @param {number} dataVersion - The expected data version (`dv`) value.
 * @param {import('zod').ZodObject<any>} fieldsConstraintsSchema - A Zod schema describing the expected shape of the object (excluding `dv`).
 * @returns {boolean} `true` if the structure is valid; `false` otherwise.
 */
function hasValidJsonStructure (args, isRequired, dataVersion, fieldsConstraintsSchema = z.object({})) {
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
        const result = fieldsConstraintsSchema.safeParse(data)

        if (!result.success) {
            for (const issue of result.error.issues) {
                const fieldName = issue.path.join('.') || 'unknown'
                addFieldValidationError(
                    `${JSON_WRONG_VERSION_FORMAT_ERROR}${fieldPath}] Field '${fieldName}': ${issue.message}`
                )
            }
            return false
        }

        return true
    } else {
        addFieldValidationError(`${JSON_UNKNOWN_VERSION_ERROR}${fieldPath}] Unknown \`dv\` attr inside JSON Object`)
        return false
    }
}

module.exports = {
    JSON_STRUCTURE_FIELDS_CONSTRAINTS,
    hasDbFields,
    hasOneOfFields,
    hasValidJsonStructure,
}
