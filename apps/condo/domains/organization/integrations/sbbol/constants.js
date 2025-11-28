const SBBOL_IMPORT_NAME = 'sbbol'
const SBBOL_FINGERPRINT_NAME = 'import-sbbol'
const SBBOL_SESSION_KEY = 'sbbol'

const dvSenderFields = {
    dv: 1,
    sender: { dv: 1, fingerprint: SBBOL_FINGERPRINT_NAME },
}

const ISO_CODES_FOR_SBBOL = {
    '810': 'RUB',
    '840': 'USD',
    '978': 'EUR',
}

const ALTERNATIVE_CURRENCY_CODES_FROM_SBBOL = {
    'RUR': 'RUB',
}

const BANK_OPERATION_CODE = {
    BUYING: '06',
}
const SbbolUserInfoSchema = {
    type: 'object',
    properties: {
        sub: { type: 'string' },
        // Organization's field
        OrgName: { type: 'string' },
        HashOrgId: { type: 'string' },
        orgOgrn: { type: 'string' },
        orgLawFormShort: { type: 'string' },
        // Organization's meta fields
        inn: { type: 'string' },
        orgKpp: { type: 'string' },
        orgJuridicalAddress: { type: 'string' },
        orgFullName: { type: 'string' },
        terBank: { type: 'string' },
        // Organization's admin user fields
        userGuid: { type: 'string' },
        email: { type: 'string' },
        phone_number: { type: 'string' },
    },
    additionalProperties: true,
    // use sub as userId on a remote system if no userGuid in response
    required: ['OrgName', 'HashOrgId', 'inn', 'phone_number'],
    anyOf: [
        { required: ['sub'] },
        { required: ['userGuid'] },
    ],
}

const ERROR_PASSED_DATE_IN_THE_FUTURE = 'An invalid date was received. It is possible to request transactions only for the past date.'
const INVALID_DATE_RECEIVED_MESSAGE = 'Passed date is not a valid date. date:'

const WORKFLOW_FAULT = 'WORKFLOW_FAULT'
const DATA_NOT_FOUND_EXCEPTION = 'DATA_NOT_FOUND_EXCEPTION'
const ACTION_ACCESS_EXCEPTION = 'ACTION_ACCESS_EXCEPTION'
const UNAUTHORIZED = 'UNAUTHORIZED'
const STATEMENT_RESPONSE_PROCESSING = 'STATEMENT_RESPONSE_PROCESSING'

const SBBOL_ERRORS = {
    WORKFLOW_FAULT,
    DATA_NOT_FOUND_EXCEPTION,
    ACTION_ACCESS_EXCEPTION,
    UNAUTHORIZED,
    STATEMENT_RESPONSE_PROCESSING,
}

module.exports = {
    SBBOL_IMPORT_NAME,
    SBBOL_FINGERPRINT_NAME,
    SBBOL_SESSION_KEY,
    dvSenderFields,
    BANK_OPERATION_CODE,
    SbbolUserInfoSchema,
    ERROR_PASSED_DATE_IN_THE_FUTURE,
    INVALID_DATE_RECEIVED_MESSAGE,
    SBBOL_ERRORS,
    ISO_CODES_FOR_SBBOL,
    ALTERNATIVE_CURRENCY_CODES_FROM_SBBOL,
}
