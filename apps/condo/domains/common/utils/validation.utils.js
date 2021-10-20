const validate = require('validate.js')
const nextCookies = require('next-cookies')

const {
    JSON_WRONG_VERSION_FORMAT_ERROR,
    JSON_UNKNOWN_VERSION_ERROR,
    JSON_EXPECT_OBJECT_ERROR,
    REQUIRED_NO_VALUE_ERROR,
} = require('@condo/domains/common/constants/errors')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')

function hasDbFields (databaseRequired, resolvedData, existingItem, context, addFieldValidationError) {
    if (typeof resolvedData === 'undefined') throw new Error('unexpected undefined resolvedData arg')
    if (typeof existingItem === 'undefined') existingItem = {}

    let hasAllFields = true

    for (let field of databaseRequired) {
        const value = existingItem[field]
        const isValueNullOrUndefined = value === null || typeof value === 'undefined'

        if (isValueNullOrUndefined && !resolvedData.hasOwnProperty(field)) {
            addFieldValidationError(`${REQUIRED_NO_VALUE_ERROR}${field}] Value is not set`)
            hasAllFields = false
        }
    }

    return hasAllFields
}

const DV_FIELD_NAME = 'dv'
const SENDER_FIELD_NAME = 'sender'
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

    if (typeof resolvedData === 'undefined') throw new Error('unexpected undefined resolvedData arg')
    if (requestRequired.length < 1) throw new Error('unexpected requestRequired list length')

    for (let field of requestRequired) {
        const value = existingItem[field]
        const newValue = resolvedData[field]
        const isValueNullOrUndefined = value === null || typeof value === 'undefined'
        const isNewValueNullOrUndefined = newValue === null || typeof newValue === 'undefined'

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

    if (typeof value !== 'object' || value === null)
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

const DEFAULT_COUNTRY = RUSSIA_COUNTRY
const RU_INN_DIGITS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8, 0]
const RU_INN_REGEXP = /^\d{10}$|^\d{12}$/
const RU_ORGANIZATION_INN_REGEXP = /^\d{10}$/
const VALID_RU_INN_10 = '1654019570'
const VALID_RU_INN_12 = '500110474504'
const INVALID_RU_INN_10 = '01234556789'
const INVALID_RU_INN_12 = '0123455678901'
const SOME_RANDOM_LETTERS = 'ABCDEFGHIJ'


const getInnChecksumRU = num => {
    const n = RU_INN_DIGITS.slice(-num.length)
    let summ = 0

    for (let i = 0; i < num.length; i++) summ += num[i] * n[i]

    let control = summ % 11

    if (control > 9) control = control % 10

    return control
}

const validateInnRU = innValue => {
    if (typeof innValue != 'string' && typeof innValue != 'number' || !RU_ORGANIZATION_INN_REGEXP.test(innValue)) return false

    const inn = innValue.toString().trim()

    if (inn.length == 10) return getInnChecksumRU(inn) == inn.slice(-1)

    // NOTE: we need INNs only for organizations, that is of 10 chars length.
    // So valid 12 char length person INN doesn`t suit
    if (inn.length == 12) return getInnChecksumRU(inn.slice(0, 11)) == inn.slice(10, -1) && getInnChecksumRU(inn) == inn.slice(-1)

    return false
}

const isInnValid = (innValue = null, country = DEFAULT_COUNTRY) => {
    if (country === RUSSIA_COUNTRY) return validateInnRU(innValue)

    // TODO: DOMA-663 add tin validations for countries other than Russian Federation
    return false
}

const getIsInnValid = (country = DEFAULT_COUNTRY) => (innValue = null) => isInnValid(innValue, country)

module.exports = {
    hasDbFields,
    hasOneOfFields,
    hasDvAndSenderFields,
    hasValidJsonStructure,
    validateInnRU,
    isInnValid,
    getIsInnValid,
    VALID_RU_INN_10,
    VALID_RU_INN_12,
    INVALID_RU_INN_10,
    INVALID_RU_INN_12,
    SOME_RANDOM_LETTERS,
}
