const { JSON_EXPECT_OBJECT_ERROR } = require('@condo/domains/common/constants/errors')
const Ajv = require('ajv')
const ajv = new Ajv()


/**
 * The basic JSON validation
 * @private
 */
function _validateJSON (resolvedData, fieldPath, addFieldValidationError) {
    if (!resolvedData.hasOwnProperty(fieldPath)) return // skip if no value
    const value = resolvedData[fieldPath]
    if (value === null) return // null is OK
    if (typeof value !== 'object')
        return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] ${fieldPath} field type error. We expect JSON Object`)
}

/**
 * This function accepts the list of validators
 * @param args - {resolvedData, fieldPath, addFieldValidationError}
 * @param validators - a list of validator functions, where each function accepts args (via spread operator) and may raise addFieldValidationError
 * @return {void|*}
 * @private
 */
function _combineValidators (args, validators) {
    const { resolvedData, fieldPath, addFieldValidationError } = args

    for (let validator of validators) {
        let validatonErrors = validator(resolvedData, fieldPath, addFieldValidationError)
        if (validatonErrors) {
            return validatonErrors
        }
    }
}

const PAYMENT_SCHEMA = {
    type: 'object',
    properties: {
        formula: { type: 'string' },
        charge: { type: 'number' },
        measure: { type: 'string' },
        tariff: { type: 'number' },
        balance: { type: 'number' },
        recalculation: { type: 'number' },
        privilege: { type: 'number' },
        penalty: { type: 'number' },
    },
    required: ['formula'],
    additionalProperties: false,
}

const _jsonPaymentObjectSchemaValidator = ajv.compile(PAYMENT_SCHEMA)

function _validatePaymentDetails (resolvedData, fieldPath, addFieldValidationError) {
    if (!_jsonPaymentObjectSchemaValidator(resolvedData[fieldPath])) {
        return _jsonPaymentObjectSchemaValidator.errors.forEach(error => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}

const SERVICES_WITH_PAYMENT_SCHEMA = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            toPay: { type: 'number' },
            toPayDetails: PAYMENT_SCHEMA,
        },
        // todo(toplenboren) discuss the analytics and standartization service for services
        required: ['name', 'toPay'],
        additionalProperties: true,
    },
}

const _jsonServicesSchemaValidator = ajv.compile(SERVICES_WITH_PAYMENT_SCHEMA)

function _validateServices (resolvedData, fieldPath, addFieldValidationError) {
    if (!_jsonServicesSchemaValidator(resolvedData[fieldPath])) {
        return _jsonServicesSchemaValidator.errors.forEach(error => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}

const PAYMENT_RECIPIENT_SCHEMA = {
    type: 'object',
    properties: {
        tin: { type: 'string' },
        bic: { type: 'string' },
        iec: { type: 'string' },
        bankAccount: { type: 'string' },
    },
    required: ['tin', 'bic', 'bankAccount', 'iec'],
    additionalProperties: true,
}

const _jsonPaymentRecipientSchemaValidator = ajv.compile(PAYMENT_RECIPIENT_SCHEMA)

function _validateRecipient (resolvedData, fieldPath, addFieldValidationError) {
    if (!_jsonPaymentRecipientSchemaValidator(resolvedData[fieldPath])) {
        return _jsonPaymentRecipientSchemaValidator.errors.forEach(error => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}

function _validatePeriod ({ resolvedData, fieldPath, addFieldValidationError }) {
    const value = resolvedData[fieldPath]
    const day = new Date(value)?.getDate()
    if (day !== 1) {
        addFieldValidationError(`${fieldPath} field validation error. Period day should always equal 1`)
    }
}

module.exports = {
    validatePaymentDetails: (args) => _combineValidators(args, [_validateJSON, _validatePaymentDetails]),
    validateServices: (args) => _combineValidators(args, [_validateJSON, _validateServices]),
    validateRecipient: (args) => _combineValidators(args, [_validateJSON, _validateRecipient]),
    validatePeriod: _validatePeriod,
}