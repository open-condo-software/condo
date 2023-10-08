const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const VALID_DATE_REGEXP_PATTERN = '20\\d\\d-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\\d|3[0-1])'
const VALID_TIME_REGEXP_PATTERN = '([0-1]\\d|2[0-3]):[0-5]\\d:[0-5]\\d.\\d{3}'
const VALID_DATEZ_REGEXP_PATTERN = `${VALID_DATE_REGEXP_PATTERN}T${VALID_TIME_REGEXP_PATTERN}Z`
const VALID_DATE_REGEXP = new RegExp(`^${VALID_DATE_REGEXP_PATTERN}$`)
const VALID_DATEZ_REGEXP = new RegExp(`^${VALID_DATEZ_REGEXP_PATTERN}$`)

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

const ajv = new Ajv()
addFormats(ajv)
const jsonReportValidator = ajv.compile(REPORT_SCHEMA)


function isValidDateValue (value) {
    return VALID_DATE_REGEXP.test(value) || VALID_DATEZ_REGEXP.test(value)
}

function validatePeriod ({ resolvedData, fieldPath, addFieldValidationError }) {
    const value = resolvedData[fieldPath]

    if (!isValidDateValue(value)) addFieldValidationError(`${fieldPath} field validation error. Period should be date in ISO format: YYYY-MM-DD`)

    const date = new Date(value)

    if (!date) addFieldValidationError(`${fieldPath} field validation error. Period should be date in ISO format: YYYY-MM-DD`)

    const day = date.getDate()

    if (day !== 1)  addFieldValidationError(`${fieldPath} field validation error. Period should always be the 1st day of the month`)
}

function validateReport ({ resolvedData, fieldPath, addFieldValidationError }) {
    if (!jsonReportValidator(resolvedData[fieldPath])) {
        jsonReportValidator.errors.forEach((error) => {
            addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
        })
    }
}

module.exports = {
    validatePeriod,
    validateReport,
    isValidDateValue,
}