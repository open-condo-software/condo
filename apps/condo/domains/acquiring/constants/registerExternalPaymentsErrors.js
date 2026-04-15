const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { PAYMENTS_LIMIT } = require('@condo/domains/acquiring/constants/registerExternalPayments')
const {
    DV_VERSION_MISMATCH,
    WRONG_FORMAT,
    NOT_FOUND,
} = require('@condo/domains/common/constants/errors')

const REGISTER_EXTERNAL_PAYMENTS_ERRORS = {
    DV_VERSION_MISMATCH: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'dv'],
        code: BAD_USER_INPUT,
        type: DV_VERSION_MISMATCH,
        message: 'Wrong value for data version number',
    },
    WRONG_SENDER_FORMAT: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'sender'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid format of "sender" field value. {details}',
        correctExample: '{ "dv": 1, "fingerprint": "uniq-device-or-container-id" }',
        messageInterpolation: { details: 'Please, check the example for details' },
    },
    PAYMENTS_LIMIT_EXCEEDED: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: `Too many payments in one request. The maximum allowed is ${PAYMENTS_LIMIT}`,
    },
    EMPTY_PAYMENTS_ARRAY: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Input should have at least one payment',
    },
    ACQUIRING_CONTEXT_NOT_FOUND: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'acquiringIntegrationContext'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'AcquiringIntegrationContext not found',
    },
    ACQUIRING_INTEGRATION_NOT_FOUND: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'acquiringIntegrationContext'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'AcquiringIntegration not found',
    },
    DUPLICATED_PAYMENTS: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: 'DUPLICATED_VALUES',
        message: 'Input data has duplicated transactionIds: {transactionIds}',
    },
    EXISTING_PAYMENTS: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: 'EXISTING_PAYMENTS',
        message: 'Some payments have transactionIds that already exist in the system: {transactionIds}',
    },
    INVALID_PERIOD_FORMAT: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid payment period format. Expected YYYY-MM-01. Found: {period} for payment: {transactionId}',
    },
    INVALID_DATE_FORMAT: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid payment date format. Expected ISO 8601 (e.g. 2026-04-06T12:00:00Z). Found: {date} for payment: {transactionId}',
    },
    INVALID_NUMERIC_FIELD: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: 'INVALID_VALUE',
        message: 'Invalid numeric field value. Must be a valid number string. Found: {field} {value} for payment: {transactionId}',
    },
    INVALID_CURRENCY_CODE: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: 'INVALID_VALUE',
        message: 'Unsupported currency code: {currencyCode} for payment: {transactionId}',
    },
    NON_POSITIVE_PAYMENT_AMOUNT: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: 'INVALID_VALUE',
        message: 'Payment amount cannot be non positive. Found: {amount} for payment: {transactionId}',
    },
    TRANSACTION_ID_REQUIRED: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: 'INVALID_VALUE',
        message: 'Transaction ID is required for payment',
    },
}

module.exports = {
    REGISTER_EXTERNAL_PAYMENTS_ERRORS,
}