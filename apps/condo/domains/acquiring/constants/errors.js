const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { PAYMENT_DONE_STATUS, MULTIPAYMENT_DONE_STATUS, PAYMENT_INIT_STATUS } = require('./payment')

const ACQUIRING_INTEGRATION_CONTEXT_IS_MISSING = 'ACQUIRING_INTEGRATION_CONTEXT_IS_MISSING'
const ACQUIRING_INTEGRATION_CONTEXT_IS_DELETED = 'ACQUIRING_INTEGRATION_CONTEXT_IS_DELETED'
const MULTIPLE_ACQUIRING_INTEGRATION_CONTEXTS = 'MULTIPLE_ACQUIRING_INTEGRATION_CONTEXTS'
const ACQUIRING_INTEGRATION_IS_DELETED = 'ACQUIRING_INTEGRATION_IS_DELETED'
const RECEIPTS_CANNOT_BE_GROUPED_BY_ACQUIRING_INTEGRATION = 'RECEIPTS_CANNOT_BE_GROUPED_BY_ACQUIRING_INTEGRATION'
const ACQUIRING_INTEGRATION_DOES_NOT_SUPPORTS_BILLING_INTEGRATION = 'ACQUIRING_INTEGRATION_DOES_NOT_SUPPORTS_BILLING_INTEGRATION'
const CANNOT_FIND_ALL_BILLING_RECEIPTS = 'CANNOT_FIND_ALL_BILLING_RECEIPTS'
const RECEIPTS_ARE_DELETED = 'RECEIPTS_ARE_DELETED'
const BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IS_DELETED = 'BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IS_DELETED'
const RECEIPT_HAS_DELETED_BILLING_INTEGRATION = 'RECEIPT_HAS_DELETED_BILLING_INTEGRATION'
const RECEIPTS_HAS_MULTIPLE_CURRENCIES = 'RECEIPTS_HAS_MULTIPLE_CURRENCIES'
const INVOICES_HAS_MULTIPLE_CURRENCIES = 'INVOICES_HAS_MULTIPLE_CURRENCIES'
const DIFFERENT_CURRENCY_CODES_FOR_RECEIPTS_AND_INVOICES = 'DIFFERENT_CURRENCY_CODES_FOR_RECEIPTS_AND_INVOICES'
const BILLING_RECEIPT_DOES_NOT_HAVE_COMMON_BILLING_ACCOUNT_WITH_SERVICE_CONSUMER = 'BILLING_RECEIPT_DOES_NOT_HAVE_COMMON_BILLING_ACCOUNT_WITH_SERVICE_CONSUMER'
const RECEIPTS_HAVE_NEGATIVE_TO_PAY_VALUE = 'RECEIPTS_HAVE_NEGATIVE_TO_PAY_VALUE'
const RECEIPT_HAVE_INVALID_TO_PAY_VALUE = 'RECEIPT_HAVE_INVALID_TO_PAY_VALUE'
const RECEIPT_HAVE_INVALID_CURRENCY_CODE_VALUE = 'RECEIPT_HAVE_INVALID_CURRENCY_CODE_VALUE'
const EMPTY_RECEIPT_AND_RECEIPT_DATA_VALUES = 'EMPTY_RECEIPT_AND_RECEIPT_DATA_VALUES'
const RECEIPT_HAVE_INVALID_PAYMENT_MONTH_VALUE = 'RECEIPT_HAVE_INVALID_PAYMENT_MONTH_VALUE'
const RECEIPT_HAVE_INVALID_PAYMENT_YEAR_VALUE = 'RECEIPT_HAVE_INVALID_PAYMENT_YEAR_VALUE'
const INVOICES_ARE_NOT_PUBLISHED = 'INVOICES_ARE_NOT_PUBLISHED'
const INVOICES_FOR_THIRD_USER = 'INVOICES_FOR_THIRD_USER'
const INVOICES_HAS_DIFFERENT_CLIENTS = 'INVOICES_HAS_DIFFERENT_CLIENTS'
const INVOICE_CONTEXT_NOT_FINISHED = 'INVOICE_CONTEXT_NOT_FINISHED'
const MUTALLY_EXCLUSIVE_DATA = 'MUTALLY_EXCLUSIVE_DATA'
const CANNOT_FIND_INVOICE = 'CANNOT_FIND_INVOICE'
const INVOICE_IS_DELETED = 'INVOICE_IS_DELETED'

const SUPPORTED_BILLING_INTEGRATION_GROUP_DOESNT_EXIST_ERROR = '[acquiringIntegration:supportedBillingIntegrationsGroupDoesNotExist] BillingIntegration with specified group does not exist'
const CONTEXT_ALREADY_HAVE_ACTIVE_CONTEXT = '[acquiringIntegrationContext:alreadyCreated] Specified organization already have active acquiring context'
const PAYMENT_NO_PAIRED_RECEIPT = '[payment:frozenReceipt:noReceipt] Input is containing "frozenReceipt", but "receipt" is not specified'
const PAYMENT_NO_PAIRED_FROZEN_RECEIPT = '[payment:receipt:noFrozenReceipt] Input is containing "receipt", but no "frozenReceipt" is not specified'
const PAYMENT_NO_PAIRED_INVOICE = 'PAYMENT_NO_PAIRED_INVOICE'
const PAYMENT_NO_PAIRED_FROZEN_INVOICE = 'PAYMENT_NO_PAIRED_FROZEN_INVOICE'
const PAYMENT_CONTEXT_ORGANIZATION_NOT_MATCH = '[payment:context:organization:noMatch] Organization in acquiring context does not match with organization specified in Payment'
const PAYMENT_NOT_ALLOWED_TRANSITION = '[payment:status:transitionNotAllowed] Restricted status transition.'
const PAYMENT_MISSING_REQUIRED_FIELDS = '[payment:requiredFieldsMissing] Some required fields for this status are missing.'
const PAYMENT_FROZEN_FIELD_INCLUDED = '[payment:frozenFieldsIncluding] It is impossible to change some fields at the current stage of the payment\'s life.'
const PAYMENT_TOO_BIG_IMPLICIT_FEE = '[payment:implicitFee:tooBig] Implicit fee cannot be greater than amount'
const PAYMENT_NO_PAIRED_CONTEXT = '[payment:receipts:noContext] Input is containing "receipt", but "context" was not provided'
const PAYMENT_NO_SUPPORTED_CONTEXT = '[payment:context:integration:supportedBillings] Acquiring integration of specified context does not support billing of specified receipt'
const PAYMENT_RECIPIENT_MISMATCH = '[payment:recipient:mismatch] Payment\'s recipient fields values does not match with receipt recipient fields'
const PAYMENT_EXPLICIT_FEE_AND_CHARGE_SAME_TIME = '[payment:explicitFee:explicitServiceCharge:bothGTZero] Both explicitFee and explicitServiceCharge were specified and set greater than 0, which is not allowed. You should set either explicitFee or explicitServiceCharge to any value greater than zero, and set other explicitly to "0"'
const PAYMENT_OVERRIDING_EXPLICIT_FEES_MUST_BE_EXPLICIT = '[payment:explicitFee:explicitServiceCharge:bothGTZero] You\'re trying to update explicitFee/explicitServiceCharge property while other property of this pair was greater than zero, but only one of them allowed to be greater than zero at the same time. You need to explicitly pass "0" to one of them'
const PAYMENT_RECEIPT_WITHOUT_ACCOUNT_NUMBER = 'RECEIPT_WITHOUT_ACCOUNT_NUMBER'
const MULTIPAYMENT_EMPTY_PAYMENTS = '[multiPayment:payments:empty] Cannot create multipayment without payments'
const MULTIPAYMENT_TOO_BIG_IMPLICIT_FEE = '[multiPayment:implicitFee:tooBig] Implicit fee cannot be greater than amount (without explicit fee)'
const MULTIPAYMENT_MULTIPLE_CURRENCIES = '[multiPayment:payments:currencyCode:mismatch] Some of listed payments have currency code which is not equal to multiPayment\'s one.'
const MULTIPAYMENT_NOT_UNIQUE_RECEIPTS = '[multiPayment:payments:receipt:duplicates] Some of listed payments have same billing receipt which is not allowed. Please group all payments with same receipt into single one and repeat process.'
const MULTIPAYMENT_TOTAL_AMOUNT_MISMATCH = '[multiPayment:amount:formulaMismatch] Amount equality is not satisfied (multiPayment.amountWithoutExplicitFee = sum of multiPayment.payments.amount)'
const MULTIPAYMENT_IMPLICIT_FEE_MISMATCH = '[multiPayment:implicitFee:formulaMismatch] All of multipayment\'s payments have implicit fee, but it\'s equality is not satisfied (multiPayment.implicitFee = sum of multiPayment.payments.implicitFee)'
const MULTIPAYMENT_SERVICE_FEE_MISMATCH = '[multiPayment:serviceFee:formulaMismatch] All of multipayment\'s payments have service fee, but it\'s  equality is not satisfied (multiPayment.serviceFee = sum of multiPayment.payments.serviceFee)'
const MULTIPAYMENT_MULTIPLE_ACQUIRING_INTEGRATIONS = '[multiPayment:receipt:context:integration:multiple] Cannot create multiPayment form payments linked to different acquiring integrations (integrations amount not equal to 1)'
const MULTIPAYMENT_ACQUIRING_INTEGRATIONS_MISMATCH = '[multiPayment:integration:mismatch] Acquiring integration from payment\'s receipts does not equal to multiPayment.integration'
const MULTIPAYMENT_CANNOT_GROUP_RECEIPTS = '[multiPayment:integration:canGroupReceipts:false:multipleReceipts] Cannot create multipayment with multiple payments since acquiring integration cannot group receipts'
const MULTIPAYMENT_NOT_ALLOWED_TRANSITION = '[multiPayment:status:transitionNotAllowed] Restricted status transition.'
const MULTIPAYMENT_MISSING_REQUIRED_FIELDS = '[multiPayment:requiredFieldsMissing] Some required fields for this status are missing.'
const MULTIPAYMENT_FROZEN_FIELD_INCLUDED = '[multiPayment:frozenFieldsIncluding] It is impossible to change some fields at the current stage of the multiPayment\'s life.'
const MULTIPAYMENT_UNDONE_PAYMENTS = `[multiPayment:payments:status:not:done] Cannot move multipayment status to "${MULTIPAYMENT_DONE_STATUS}" if at least 1 of it's payments have status not equal to "${PAYMENT_DONE_STATUS}".`
const MULTIPAYMENT_DELETED_PAYMENTS = `[multiPayment:payments:deletedAt:not:null] Cannot move multipayment status to "${MULTIPAYMENT_DONE_STATUS}" if at least 1 of it's payments was deleted.`
const MULTIPAYMENT_EXPLICIT_FEE_MISMATCH = '[multiPayment:explicitFee:formulaMismatch] Explicit fee equality is not satisfied (multiPayment.explicitFee = sum of multiPayment.payments.explicitFee)'
const MULTIPAYMENT_EXPLICIT_SERVICE_CHARGE_MISMATCH = '[multiPayment:explicitServiceCharge:formulaMismatch] Explicit service charge equality is not satisfied (multiPayment.explicitServiceCharge = sum of multiPayment.payments.explicitServiceCharge)'
const MULTIPAYMENT_INCONSISTENT_IMPLICIT_FEE = '[multiPayment:payments:implicitFee:inconsistentBehaviour] Implicit fee must be indicated either for all payments, or for none of them, but was partially indicated'
const MULTIPAYMENT_INCONSISTENT_SERVICE_FEE = '[multiPayment:payments:serviceFee:inconsistentBehaviour] Service fee must be indicated either for all payments, or for none of them, but was partially indicated'
const MULTIPAYMENT_NON_INIT_PAYMENTS = `[multiPayment:payments:status:not:initial] MultiPayment cannot be created if any of payments has status not equal to "${PAYMENT_INIT_STATUS}".`
const MULTIPAYMENT_PAYMENTS_ALREADY_WITH_MP = '[multiPayment:payments:multiPayment:not:null] Some of payments are already linked to multipayments.'
const MULTIPAYMENT_NOT_UNIQUE_INVOICES = 'MULTIPAYMENT_NOT_UNIQUE_INVOICES'
const MULTIPAYMENT_MULTIPLE_INTEGRATIONS = 'MULTIPAYMENT_MULTIPLE_INTEGRATIONS'

const FEE_DISTRIBUTION_UNSUPPORTED_FORMULA = '[feeDistribution:wrong:formula'
const FEE_DISTRIBUTION_INCOMPLETE_FORMULA = '[feeDistribution:missing:recipient'
const FEE_TOTAL_SUM_CHECK_FAILED = '[feeDistribution:total:check:failed'
const FEE_TOTAL_COMMISSION_CHECK_FAILED = '[feeDistribution:fee:check:failed'

const RECURRENT_PAYMENT_CONTEXT_BOTH_TRIGGER_SET_UP_ERROR = 'RECURRENT_PAYMENT_CONTEXT_BOTH_TRIGGER_SET_UP_ERROR'
const RECURRENT_PAYMENT_CONTEXT_NO_TRIGGER_SET_UP_ERROR = 'RECURRENT_PAYMENT_CONTEXT_NO_TRIGGER_SET_UP_ERROR'
const RECURRENT_PAYMENT_CONTEXT_PAYMENT_DAY_WRONG_RANGE_ERROR = 'RECURRENT_PAYMENT_CONTEXT_PAYMENT_DAY_WRONG_RANGE_ERROR'

const GQL_ERRORS = {
    RECURRENT_PAYMENT_CONTEXT_BOTH_TRIGGER_SET_UP_ERROR: {
        code: BAD_USER_INPUT,
        type: RECURRENT_PAYMENT_CONTEXT_BOTH_TRIGGER_SET_UP_ERROR,
        message: 'You have to set only one trigger',
    },
    RECURRENT_PAYMENT_CONTEXT_NO_TRIGGER_SET_UP_ERROR: {
        code: BAD_USER_INPUT,
        type: RECURRENT_PAYMENT_CONTEXT_NO_TRIGGER_SET_UP_ERROR,
        message: 'You have to set at least one trigger',
    },
    RECURRENT_PAYMENT_CONTEXT_PAYMENT_DAY_WRONG_RANGE_ERROR: {
        code: BAD_USER_INPUT,
        type: RECURRENT_PAYMENT_CONTEXT_PAYMENT_DAY_WRONG_RANGE_ERROR,
        message: 'You have to set value for paymentDay in range 1-31',
    },
}

module.exports = {
    ACQUIRING_INTEGRATION_CONTEXT_IS_MISSING,
    ACQUIRING_INTEGRATION_CONTEXT_IS_DELETED,
    MULTIPLE_ACQUIRING_INTEGRATION_CONTEXTS,
    RECEIPTS_CANNOT_BE_GROUPED_BY_ACQUIRING_INTEGRATION,
    ACQUIRING_INTEGRATION_DOES_NOT_SUPPORTS_BILLING_INTEGRATION,
    CANNOT_FIND_ALL_BILLING_RECEIPTS,
    RECEIPTS_ARE_DELETED,
    RECEIPTS_HAS_MULTIPLE_CURRENCIES,
    INVOICES_HAS_MULTIPLE_CURRENCIES,
    DIFFERENT_CURRENCY_CODES_FOR_RECEIPTS_AND_INVOICES,
    BILLING_RECEIPT_DOES_NOT_HAVE_COMMON_BILLING_ACCOUNT_WITH_SERVICE_CONSUMER,
    ACQUIRING_INTEGRATION_IS_DELETED,
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IS_DELETED,
    RECEIPT_HAS_DELETED_BILLING_INTEGRATION,
    RECEIPTS_HAVE_NEGATIVE_TO_PAY_VALUE,
    RECEIPT_HAVE_INVALID_TO_PAY_VALUE,
    RECEIPT_HAVE_INVALID_CURRENCY_CODE_VALUE,
    EMPTY_RECEIPT_AND_RECEIPT_DATA_VALUES,
    RECEIPT_HAVE_INVALID_PAYMENT_MONTH_VALUE,
    RECEIPT_HAVE_INVALID_PAYMENT_YEAR_VALUE,
    INVOICES_HAS_DIFFERENT_CLIENTS,
    SUPPORTED_BILLING_INTEGRATION_GROUP_DOESNT_EXIST_ERROR,
    CONTEXT_ALREADY_HAVE_ACTIVE_CONTEXT,
    PAYMENT_NO_PAIRED_RECEIPT,
    PAYMENT_NO_PAIRED_FROZEN_RECEIPT,
    PAYMENT_NO_PAIRED_INVOICE,
    PAYMENT_NO_PAIRED_FROZEN_INVOICE,
    PAYMENT_CONTEXT_ORGANIZATION_NOT_MATCH,
    PAYMENT_NOT_ALLOWED_TRANSITION,
    PAYMENT_MISSING_REQUIRED_FIELDS,
    PAYMENT_FROZEN_FIELD_INCLUDED,
    PAYMENT_NO_PAIRED_CONTEXT,
    PAYMENT_TOO_BIG_IMPLICIT_FEE,
    PAYMENT_NO_SUPPORTED_CONTEXT,
    PAYMENT_RECIPIENT_MISMATCH,
    PAYMENT_EXPLICIT_FEE_AND_CHARGE_SAME_TIME,
    PAYMENT_OVERRIDING_EXPLICIT_FEES_MUST_BE_EXPLICIT,
    PAYMENT_RECEIPT_WITHOUT_ACCOUNT_NUMBER,
    MULTIPAYMENT_EMPTY_PAYMENTS,
    MULTIPAYMENT_TOO_BIG_IMPLICIT_FEE,
    MULTIPAYMENT_MULTIPLE_CURRENCIES,
    MULTIPAYMENT_NOT_UNIQUE_RECEIPTS,
    MULTIPAYMENT_TOTAL_AMOUNT_MISMATCH,
    MULTIPAYMENT_IMPLICIT_FEE_MISMATCH,
    MULTIPAYMENT_MULTIPLE_ACQUIRING_INTEGRATIONS,
    MULTIPAYMENT_ACQUIRING_INTEGRATIONS_MISMATCH,
    MULTIPAYMENT_CANNOT_GROUP_RECEIPTS,
    MULTIPAYMENT_NOT_ALLOWED_TRANSITION,
    MULTIPAYMENT_MISSING_REQUIRED_FIELDS,
    MULTIPAYMENT_FROZEN_FIELD_INCLUDED,
    MULTIPAYMENT_UNDONE_PAYMENTS,
    MULTIPAYMENT_EXPLICIT_FEE_MISMATCH,
    MULTIPAYMENT_INCONSISTENT_IMPLICIT_FEE,
    MULTIPAYMENT_DELETED_PAYMENTS,
    MULTIPAYMENT_NON_INIT_PAYMENTS,
    MULTIPAYMENT_PAYMENTS_ALREADY_WITH_MP,
    MULTIPAYMENT_INCONSISTENT_SERVICE_FEE,
    MULTIPAYMENT_SERVICE_FEE_MISMATCH,
    MULTIPAYMENT_EXPLICIT_SERVICE_CHARGE_MISMATCH,
    MULTIPAYMENT_MULTIPLE_INTEGRATIONS,
    FEE_DISTRIBUTION_UNSUPPORTED_FORMULA,
    FEE_DISTRIBUTION_INCOMPLETE_FORMULA,
    FEE_TOTAL_SUM_CHECK_FAILED,
    FEE_TOTAL_COMMISSION_CHECK_FAILED,
    RECURRENT_PAYMENT_CONTEXT_BOTH_TRIGGER_SET_UP_ERROR,
    RECURRENT_PAYMENT_CONTEXT_NO_TRIGGER_SET_UP_ERROR,
    RECURRENT_PAYMENT_CONTEXT_PAYMENT_DAY_WRONG_RANGE_ERROR,
    GQL_ERRORS,
    INVOICES_ARE_NOT_PUBLISHED,
    INVOICES_FOR_THIRD_USER,
    INVOICE_CONTEXT_NOT_FINISHED,
    MULTIPAYMENT_NOT_UNIQUE_INVOICES,
    MUTALLY_EXCLUSIVE_DATA,
    CANNOT_FIND_INVOICE,
    INVOICE_IS_DELETED,
}
