const { SUBSCRIPTION_PAYMENT_STATUS } = require('@condo/domains/subscription/constants')

const SBBOL_IMPORT_NAME = 'sbbol'
const SBBOL_FINGERPRINT_NAME = 'import-sbbol'
const SBBOL_SESSION_KEY = 'sbbol'

const dvSenderFields = {
    dv: 1,
    sender: { dv: 1, fingerprint: SBBOL_FINGERPRINT_NAME },
}

const BANK_OPERATION_CODE = {
    BUYING: '06',
}

const SBBOL_PAYMENT_STATUS_MAP = {
    'DELIVERED': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'VALIDEDS': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'INVALIDEDS': SUBSCRIPTION_PAYMENT_STATUS.ERROR,
    'REQUISITEERROR': SUBSCRIPTION_PAYMENT_STATUS.ERROR,
    'TRIED': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'DELAYED': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'CORRESPONDENT_APPROVE_WAITING': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'EXPORTED': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'IMPLEMENTED': SUBSCRIPTION_PAYMENT_STATUS.DONE,
    'REFUSEDBYABS': SUBSCRIPTION_PAYMENT_STATUS.ERROR,
    'ACCEPTED_BY_ABS': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'CARD2': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'SIGNED_BANK': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'ACCEPTED': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'CHECKERROR': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'UNABLE_TO_RECEIVE': SUBSCRIPTION_PAYMENT_STATUS.ERROR,
    'CREATED': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'INCONSISTENT_DATA': SUBSCRIPTION_PAYMENT_STATUS.ERROR,
    'SENDED_TO_PAYER': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'ACCEPTANCE': SUBSCRIPTION_PAYMENT_STATUS.DONE,
    'NONEACCEPTANCE': SUBSCRIPTION_PAYMENT_STATUS.CANCELLED,
    'PARTSIGNED': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
    'SIGNED': SUBSCRIPTION_PAYMENT_STATUS.PROCESSING,
}

const SbbolUserInfoSchema = {
    type: 'object',
    properties: {
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
    required: ['inn', 'OrgName', 'userGuid', 'phone_number', 'HashOrgId'],
    additionalProperties: true,
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
    SBBOL_PAYMENT_STATUS_MAP,
    SbbolUserInfoSchema,
    ERROR_PASSED_DATE_IN_THE_FUTURE,
    INVALID_DATE_RECEIVED_MESSAGE,
    SBBOL_ERRORS,
}