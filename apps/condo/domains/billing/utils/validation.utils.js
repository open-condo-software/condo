const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const ajv = new Ajv()
addFormats(ajv)

function validatePeriod ({ resolvedData, fieldPath, addFieldValidationError }) {
    const value = resolvedData[fieldPath]
    const date = new Date(value)
    if (!date) {
        addFieldValidationError(`${fieldPath} field validation error. Period should be date in ISO format: YYYY-MM-DD`)
    }
    const day = date.getDate()
    if (day !== 1) {
        addFieldValidationError(`${fieldPath} field validation error. Period day should always be equal to 01`)
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

module.exports = {
    validatePeriod: validatePeriod,
    validateReport: validateReport,
}