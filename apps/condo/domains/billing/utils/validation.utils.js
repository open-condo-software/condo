const { JSON_EXPECT_OBJECT_ERROR } = require('@condo/domains/common/constants/errors')
const Ajv = require('ajv')
const ajv = new Ajv()

const PAYMENT_SCHEMA_JSON = {
    type: 'object',
    properties: {
        formula: { type: 'string' },
    },
    required: ['formula'],
    additionalProperties: true,
}

const SERVICES_WITH_PAYMENT_SCHEMA_JSON = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            toPay: { type: 'number' },
            toPayDetails: PAYMENT_SCHEMA_JSON,
        },
        // todo(toplenboren) discuss the analytics and standartization service for services
        required: ['name', 'toPay'],
        additionalProperties: true,
    },
}

const _jsonPaymentObjectValidator = ajv.compile(PAYMENT_SCHEMA_JSON)
const _jsonServicesValidator = ajv.compile(SERVICES_WITH_PAYMENT_SCHEMA_JSON)

function _validateJSON (resolvedData, fieldPath, addFieldValidationError) {
    if (!resolvedData.hasOwnProperty(fieldPath)) return // skip if no value
    const value = resolvedData[fieldPath]
    if (value === null) return // null is OK
    if (typeof value !== 'object')
        return addFieldValidationError(`${JSON_EXPECT_OBJECT_ERROR}${fieldPath}] ${fieldPath} field type error. We expect JSON Object`)
}

function validatePaymentDetails (args) {
    const { resolvedData, fieldPath, addFieldValidationError } = args
    const commonValidationErrors = _validateJSON(args)
    if (commonValidationErrors)
        return commonValidationErrors
    if (!_jsonPaymentObjectValidator(resolvedData[fieldPath])) {
        return _jsonPaymentObjectValidator.errors.forEach(error => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}

function validateServices (args) {
    const { resolvedData, fieldPath, addFieldValidationError } = args
    const commonValidationErrors = _validateJSON(args)
    if (commonValidationErrors)
        return commonValidationErrors
    if (!_jsonServicesValidator(resolvedData[fieldPath])) {
        return _jsonServicesValidator.errors.forEach(error => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}
	
module.exports = {
    validatePaymentDetails,
    validateServices,
}