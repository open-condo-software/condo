const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const {
    DV_VERSION_MISMATCH,
    WRONG_FORMAT,
    NOT_FOUND,
} = require('@condo/domains/common/constants/errors')

const PAYMENTS_LIMIT = 100

const ERRORS = {
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
        message: 'Some payments have transactionIds that already exist in the system: {ids}',
    },
    INVALID_PARAMS: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Some payment parameters are invalid: {details}',
        messageInterpolation: { details: 'Check transactionId: {transactionId}' },
    },
    INVALID_PERIOD_FORMAT: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid payment period format. Expected YYYY-MM-01. Found: {period} for transaction: {transactionId}',
    },
    INVALID_DATE_FORMAT: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid payment date format. Expected ISO 8601 (e.g. 2026-04-06T12:00:00Z). Found: {date} for transaction: {transactionId}',
    },
    INVALID_PAYMENT_AMOUNT: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: 'INVALID_VALUE',
        message: 'Invalid payment amount value. Must be a valid number string. Found: {amount} for transaction: {transactionId}',
    },
    INVALID_CURRENCY_CODE: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: 'INVALID_VALUE',
        message: 'Unsupported currency code: {currencyCode} for transaction: {transactionId}',
    },
    NEGATIVE_PAYMENT_AMOUNT: {
        mutation: 'registerExternalPayments',
        variable: ['data', 'payments'],
        code: BAD_USER_INPUT,
        type: 'INVALID_VALUE',
        message: 'Payment amount cannot be negative. Found: {amount} for transaction: {transactionId}',
    },
}

module.exports = {
    ERRORS,
    PAYMENTS_LIMIT,
}