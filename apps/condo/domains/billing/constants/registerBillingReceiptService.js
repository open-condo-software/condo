const { GQLErrorCode: { BAD_USER_INPUT, INTERNAL_ERROR } } = require('@open-condo/keystone/errors')

const { NOT_FOUND, WRONG_FORMAT, WRONG_VALUE } = require('@condo/domains/common/constants/errors')

const RECEIPTS_LIMIT = 1000
const ADDRESS_SERVICE_NORMALIZE_CHUNK_SIZE = 10
const PROPERTY_SCORE_TO_PASS = 95

const ERRORS = {
    BILLING_CONTEXT_NOT_FOUND: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'context'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Provided BillingIntegrationOrganizationContext is not found: {billingContextId}',
        messageForUser: 'api.billing.registerBillingReceipts.BILLING_CONTEXT_NOT_FOUND',
    },
    BILLING_CATEGORY_NOT_FOUND: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'category'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Provided BillingCategory is not found: {categoryId}',
        messageForUser: 'api.billing.registerBillingReceipts.BILLING_CATEGORY_NOT_FOUND',
    },
    WRONG_YEAR: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'year'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Year is wrong: {year}. Year should be in format YYYY. Example: 2023',
        messageForUser: 'api.billing.registerBillingReceipts.WRONG_YEAR',
    },
    WRONG_MONTH: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'month'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Month is wrong: {month}. Month should be greater then 0 and less then 13. Example: 1 - January. 12 - December',
        messageForUser: 'api.billing.registerBillingReceipts.WRONG_MONTH',
    },
    ADDRESS_NOT_RECOGNIZED_VALUE: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'address'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'Address is not recognized: {address}',
        messageForUser: 'api.billing.registerBillingReceipts.ADDRESS_NOT_RECOGNIZED_VALUE',
    },
    ACCOUNT_SAVE_FAILED: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'accountNumber'],
        code: INTERNAL_ERROR,
        type: WRONG_VALUE,
        message: 'Error on saving BillingAccount: {accountNumber}',
        messageForUser: 'api.billing.registerBillingReceipts.ACCOUNT_SAVE_FAILED',
    },
    PROPERTY_SAVE_FAILED: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'address'],
        code: INTERNAL_ERROR,
        type: WRONG_VALUE,
        message: 'Error on saving BillingProperty: {address}',
        messageForUser: 'api.billing.registerBillingReceipts.PROPERTY_SAVE_FAILED',
    },
    RECEIPT_SAVE_FAILED: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'importId'],
        code: INTERNAL_ERROR,
        type: WRONG_VALUE,
        message: 'Error on saving BillingReceipt: {receiptIdentity}',
        messageForUser: 'api.billing.registerBillingReceipts.RECEIPT_SAVE_FAILED',
    },
    RECIPIENT_SAVE_FAILED: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'bankAccount'],
        code: INTERNAL_ERROR,
        type: WRONG_VALUE,
        message: 'Error on saving BillingRecipient: {bankAccount}',
        messageForUser: 'api.billing.registerBillingReceipts.RECIPIENT_SAVE_FAILED',
    },
    BANK_FOUND_ERROR: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'routingNumber'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'No information about the bank from routingNumber: {routingNumber}',
        messageForUser: 'api.billing.registerBillingReceipts.BANK_FOUND_ERROR',
    },
    ORGANIZATION_FOUND_ERROR: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'tin'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'No information about the organization from tin: {tin}',
        messageForUser: 'api.billing.registerBillingReceipts.ORGANIZATION_FOUND_ERROR',
    },
    WRONG_AMOUNT_FORMAT: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid money amount in {field}: {value}',
        messageForUser: 'api.billing.registerBillingReceipts.WRONG_AMOUNT_FORMAT',
    },
    RECEIPTS_LIMIT_HIT: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'Too many receipts in one query: {count}. We support up to {limit} receipts',
        messageForUser: 'api.billing.registerBillingReceipts.RECEIPTS_LIMIT_HIT',
    },
}

const RECIPIENT_IS_NOT_APPROVED = 'RECIPIENT_IS_NOT_APPROVED'
const NO_PROPERTY_IN_ORGANIZATION = 'NO_PROPERTY_IN_ORGANIZATION'


module.exports = {
    RECEIPTS_LIMIT,
    ADDRESS_SERVICE_NORMALIZE_CHUNK_SIZE,
    PROPERTY_SCORE_TO_PASS,
    ERRORS,
    RECIPIENT_IS_NOT_APPROVED,
    NO_PROPERTY_IN_ORGANIZATION,
}
