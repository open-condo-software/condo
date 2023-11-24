const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { NOT_FOUND, WRONG_FORMAT, WRONG_VALUE } = require('@condo/domains/common/constants/errors')

const RECEIPTS_LIMIT = 1000
const ADDRESS_SERVICE_NORMALIZE_CHUNK_SIZE = 50
const PROPERTY_SCORE_TO_PASS = 95

const ERRORS = {
    BILLING_CONTEXT_NOT_FOUND: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'context'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Provided BillingIntegrationOrganizationContext is not found',
    },
    BILLING_CATEGORY_NOT_FOUND: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'category'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Provided BillingCategory is not found for some receipts',
    },
    WRONG_YEAR: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'year'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Year is wrong for some receipts. Year should be in format YYYY. Example: 2023',
    },
    WRONG_MONTH: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'month'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Month is wrong for some receipts. Month should be greater then 0 and less then 13. Example: 1 - January. 12 - December',
    },
    ADDRESS_EMPTY_VALUE: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'address'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'Address is empty for some receipts',
    },
    ADDRESS_NOT_RECOGNIZED_VALUE: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'address'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'Address is not recognized for some receipts. We tried to recognize address, but failed. You can either double check address field or manually provide a normalizedAddress',
    },
    ACCOUNT_DUPLICATED: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'accountNumber'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'You have several receipts in request that has the same account number and property address',
    },
    BANK_FOUND_ERROR: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'bic'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'No information about bank from bic',
    },
    ORGANIZATION_FOUND_ERROR: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts', '[]', 'tin'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: 'No information about organization from tin',
    },
    RECEIPTS_LIMIT_HIT: {
        mutation: 'registerBillingReceipts',
        variable: ['data', 'receipts'],
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        message: `Too many receipts in one query! We support up to ${RECEIPTS_LIMIT} receipts`,
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