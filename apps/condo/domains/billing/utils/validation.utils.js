const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const ajv = new Ajv()
addFormats(ajv)

const PAYMENT_SCHEMA = {
    type: 'object',
    properties: {
        formula: { type: 'string' },
        charge: { type: 'string' },
        measure: { type: 'string' },
        tariff: { type: 'string' },
        balance: { type: 'string' },
        recalculation: { type: 'string' },
        privilege: { type: 'string' },
        penalty: { type: 'string' },
    },
    required: ['formula'],
    additionalProperties: false,
}

const jsonPaymentObjectSchemaValidator = ajv.compile(PAYMENT_SCHEMA)

function validatePaymentDetails ({ resolvedData, fieldPath, addFieldValidationError }) {
    if (!jsonPaymentObjectSchemaValidator(resolvedData[fieldPath])) {
        jsonPaymentObjectSchemaValidator.errors.forEach(error => {
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
            toPay: { type: 'string' },
            toPayDetails: PAYMENT_SCHEMA,
        },
        // todo(toplenboren) discuss the analytics and standartization service for services
        required: ['name', 'toPay'],
        additionalProperties: true,
    },
}

const jsonServicesSchemaValidator = ajv.compile(SERVICES_WITH_PAYMENT_SCHEMA)

function validateServices ({ resolvedData, fieldPath, addFieldValidationError }) {
    if (!jsonServicesSchemaValidator(resolvedData[fieldPath])) {
        jsonServicesSchemaValidator.errors.forEach(error => {
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

const jsonPaymentRecipientSchemaValidator = ajv.compile(PAYMENT_RECIPIENT_SCHEMA)

function validateRecipient ({ resolvedData, fieldPath, addFieldValidationError }) {
    if (!jsonPaymentRecipientSchemaValidator(resolvedData[fieldPath])) {
        jsonPaymentRecipientSchemaValidator.errors.forEach(error => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}

function validatePeriod ({ resolvedData, fieldPath, addFieldValidationError }) {
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

const REPORT_SCHEMA = {
    type: 'object',
    properties: {
        period: { type: 'string', format: 'date' },
        finishTime: { type: 'string', format: 'date-time' },
        totalReceipts: { type: 'number' },
    },
    required: ['period', 'finishTime', 'totalReceipts'],
    additionalProperties: false,
}

const jsonReportValidator = ajv.compile(REPORT_SCHEMA)

function validateReport ({ resolvedData, fieldPath, addFieldValidationError }) {
    if (!jsonReportValidator(resolvedData[fieldPath])) {
        jsonReportValidator.errors.forEach((error) => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}

const DATA_FORMAT_SCHEMA = {
    type: 'object',
    properties: {
        hasToPayDetail: { type: 'boolean' },    // True if billingReceipt has toPay detailization: e.g debt, recalculation fields
        hasServices: { type: 'boolean' },       // True if billingReceipt has services object: e.g cold water service
        hasServicesDetail: { type: 'boolean' }, // True if billingReceipt's services has detail: e.g debt and recalculation for cold water service
    },
    required: ['hasToPayDetail', 'hasServices', 'hasServicesDetail'],
    additionalProperties: false,
}

const jsonDataFormatValidator = ajv.compile(DATA_FORMAT_SCHEMA)

function validateDataFormat ({ resolvedData, fieldPath, addFieldValidationError }) {
    if (!jsonDataFormatValidator(resolvedData[fieldPath])) {
        return jsonDataFormatValidator.errors.forEach((error) => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}

module.exports = {
    validatePaymentDetails: validatePaymentDetails,
    validateServices: validateServices,
    validateRecipient: validateRecipient,
    validatePeriod: validatePeriod,
    validateReport: validateReport,
    validateDataFormat: validateDataFormat,
}