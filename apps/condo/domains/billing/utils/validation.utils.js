const { JSON_EXPECT_OBJECT_ERROR } = require('@condo/domains/common/constants/errors')
const Ajv = require('ajv')
const ajv = new Ajv()

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

function _validatePaymentDetails ({ resolvedData, fieldPath, addFieldValidationError }) {
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

function _validateServices ({ resolvedData, fieldPath, addFieldValidationError }) {
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

function _validateRecipient ({ resolvedData, fieldPath, addFieldValidationError }) {
    if (!_jsonPaymentRecipientSchemaValidator(resolvedData[fieldPath])) {
        return _jsonPaymentRecipientSchemaValidator.errors.forEach(error => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}

function _validatePeriod ({ resolvedData, fieldPath, addFieldValidationError }) {
    const value = resolvedData[fieldPath]
    const date = new Date(value)
    if (!date) {
        addFieldValidationError(`${fieldPath} field validation error. Period should be date in ISO format: YYYY-MM-DD`)
    }
    const day = date.getDate()
    if (day !== 1) {
        addFieldValidationError(`${fieldPath} field validation error. Period day should always equal 1`)
    }
}

module.exports = {
    validatePaymentDetails: _validatePaymentDetails,
    validateServices: _validateServices,
    validateRecipient: _validateRecipient,
    validatePeriod: _validatePeriod,
}