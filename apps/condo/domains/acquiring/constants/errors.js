const { PAYMENT_DONE_STATUS, MULTIPAYMENT_DONE_STATUS, PAYMENT_INIT_STATUS } = require('./payment')

const REGISTER_MP_EMPTY_INPUT = '[groupedReceipts:empty] GroupedReceipts was empty'
const REGISTER_MP_EMPTY_RECEIPTS = '[groupedReceipts:receipts:empty] Each group of receipts should contain at least 1 receipt'
const REGISTER_MP_CONSUMERS_DUPLICATE = '[groupedReceipts:consumerId:duplicate] There are some groupedReceipts with same consumerId'
const REGISTER_MP_RECEIPTS_DUPLICATE = '[groupedReceipts:receipts:id:duplicate] Found duplicated receipt\'s ids. Note, each receipt can only occur in single ServiceConsumer per mutation run and cannot be noticed twice'
const REGISTER_MP_REAL_CONSUMER_MISMATCH = '[groupedReceipts:consumerId:nonExistingConsumer] Cannot find all specified ServiceConsumers.'
const REGISTER_MP_DELETED_CONSUMERS = '[groupedReceipts:consumerId:deleted] Some of specified ServiceConsumers were deleted, so you cannot pay for them anymore'
const REGISTER_MP_NO_ACQUIRING_CONSUMERS = '[serviceConsumer:noAcquiringContext] Some of ServiceConsumers doesn\'t have Acquiring context.'
const REGISTER_MP_NO_BILLING_ACCOUNT_CONSUMERS = '[serviceConsumer:noBillingAccount] Some of ServiceConsumers doesn\'t have Billing account, so receipt-consumer relation cannot be defined.'
const REGISTER_MP_DELETED_ACQUIRING_CONTEXTS = '[groupedReceipts:consumerId:acquiringContext:deleted] Some of specified ServiceConsumers has deleted acquiring integration context, so you cannot pay for them anymore'
const REGISTER_MP_MULTIPLE_INTEGRATIONS = '[serviceConsumer:acquiringContext:multipleIntegrations] Listed consumerIds are linked to different acquiring integrations'
const REGISTER_MP_DELETED_ACQUIRING_INTEGRATION = '[serviceConsumer:acquiringContext:acquiringIntegration:deleted] Cannot pay via deleted acquiring.'
const REGISTER_MP_CANNOT_GROUP_RECEIPTS = '[acquiringIntegration:canGroupReceipts:false:multipleReceipts] receipts total length was > 1, but acquiring integration cannot group billing receipts'
const REGISTER_MP_UNSUPPORTED_BILLING = '[acquiringIntegration:supportedBillingIntegrations:notIncludesReceiptBilling] Some of billing receipts are not supported by ServiceConsumer\'s acquiring integration'
const REGISTER_MP_REAL_RECEIPTS_MISMATCH = '[groupedReceipts:receipts:nonExistingReceipt] Cannot find all specified BillingReceipts.'
const REGISTER_MP_DELETED_RECEIPTS = '[groupedReceipts:receipts:deletedReceipt] Cannot pay for deleted receipts.'
const REGISTER_MP_DELETED_BILLING_CONTEXT = '[groupedReceipts:receipts:context:deleted] Cannot pay for receipts with deleted billing context.'
const REGISTER_MP_DELETED_BILLING_INTEGRATION = '[groupedReceipts:receipts:context:integration:deleted] Cannot pay for receipts with deleted billing integration.'
const REGISTER_MP_MULTIPLE_CURRENCIES = '[groupedReceipts:receipts:context:integration:currencyCode:multipleFound] Cannot pay for receipts with multiple currencies.'
const REGISTER_MP_BILLING_ACCOUNTS_NO_MATCH = '[groupedReceipts:receipts:noCommonBillingAccount] Billing receipt with specified id doesn\'t have common billing account with specified ServiceConsumer'
const REGISTER_MP_INVALID_SENDER = '[sender:invalidValue] Sender has invalid value.'
const REGISTER_MP_NEGATIVE_TO_PAY = '[groupedReceipts:receipts] Cannot pay for receipts with negative toPay.'
const INTEGRATION_NO_BILLINGS_ERROR = '[acquiringIntegration:noBillings] Acquiring integration must cover at least 1 billing'
const CONTEXT_ALREADY_HAVE_ACTIVE_CONTEXT = '[acquiringIntegrationContext:alreadyCreated] Specified organization already have active acquiring context'
const PAYMENT_NO_PAIRED_RECEIPT = '[payment:frozenReceipt:noReceipt] Input is containing "frozenReceipt", but "receipt" is not specified'
const PAYMENT_NO_PAIRED_FROZEN_RECEIPT = '[payment:receipt:noFrozenReceipt] Input is containing "receipt", but no "frozenReceipt" is not specified'
const PAYMENT_CONTEXT_ORGANIZATION_NOT_MATCH = '[payment:context:organization:noMatch] Organization in acquiring context does not match with organization specified in Payment'
const PAYMENT_NOT_ALLOWED_TRANSITION = '[payment:status:transitionNotAllowed] Restricted status transition.'
const PAYMENT_MISSING_REQUIRED_FIELDS = '[payment:requiredFieldsMissing] Some required fields for this status are missing.'
const PAYMENT_FROZEN_FIELD_INCLUDED = '[payment:frozenFieldsIncluding] It is impossible to change some fields at the current stage of the payment\'s life.'
const PAYMENT_TOO_BIG_IMPLICIT_FEE = '[payment:implicitFee:tooBig] Implicit fee cannot be greater than amount'
const PAYMENT_NO_PAIRED_CONTEXT = '[payment:receipts:noContext] Input is containing "receipt", but "context" was not provided'
const PAYMENT_NO_SUPPORTED_CONTEXT = '[payment:context:integration:supportedBillings] Acquiring integration of specified context does not support billing of specified receipt'
const PAYMENT_RECIPIENT_MISMATCH = '[payment:recipient:mismatch] Payment\'s recipient fields values does not match with receipt recipient fields'
const PAYMENT_EXPLICIT_FEE_AND_CHARGE_SAME_TIME = '[payment:explicitFee:explicitServiceCharge:bothGTZero] Explicit fee and explicit service charge were specified, and both of them are greater than 0, which is not allowed'
const PAYMENT_OVERRIDING_EXPLICIT_FEES_MUST_BE_EXPLICIT = '[payment:explicitFee:explicitServiceCharge:bothGTZero] You\'re trying to update explicitFee/explicitServiceCharge property while other property of this pair was greater than zero, but only one of them allowed to be greater than zero at the same time. You need to explicitly pass "0" to one of them'
const MULTIPAYMENT_EMPTY_PAYMENTS = '[multiPayment:payments:empty] Cannot create multipayment without payments'
const MULTIPAYMENT_TOO_BIG_IMPLICIT_FEE = '[multiPayment:implicitFee:tooBig] Implicit fee cannot be greater than amount (without explicit fee)'
const MULTIPAYMENT_NO_RECEIPT_PAYMENTS = '[multiPayment:payments:noReceipt] Some of listed payments have no receipts.'
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
const MULTIPAYMENT_INCONSISTENT_IMPLICIT_FEE = '[multiPayment:payments:implicitFee:inconsistentBehaviour] Implicit fee must be indicated either for all payments, or for none of them, but was partially indicated'
const MULTIPAYMENT_INCONSISTENT_SERVICE_FEE = '[multiPayment:payments:serviceFee:inconsistentBehaviour] Service fee must be indicated either for all payments, or for none of them, but was partially indicated'
const MULTIPAYMENT_NON_INIT_PAYMENTS = `[multiPayment:payments:status:not:initial] MultiPayment cannot be created if any of payments has status not equal to "${PAYMENT_INIT_STATUS}".`
const MULTIPAYMENT_PAYMENTS_ALREADY_WITH_MP = '[multiPayment:payments:multiPayment:not:null] Some of payments are already linked to multipayments.'

module.exports = {
    REGISTER_MP_EMPTY_INPUT,
    REGISTER_MP_EMPTY_RECEIPTS,
    REGISTER_MP_CONSUMERS_DUPLICATE,
    REGISTER_MP_RECEIPTS_DUPLICATE,
    REGISTER_MP_REAL_CONSUMER_MISMATCH,
    REGISTER_MP_NO_ACQUIRING_CONSUMERS,
    REGISTER_MP_NO_BILLING_ACCOUNT_CONSUMERS,
    REGISTER_MP_MULTIPLE_INTEGRATIONS,
    REGISTER_MP_CANNOT_GROUP_RECEIPTS,
    REGISTER_MP_UNSUPPORTED_BILLING,
    REGISTER_MP_REAL_RECEIPTS_MISMATCH,
    REGISTER_MP_DELETED_RECEIPTS,
    REGISTER_MP_MULTIPLE_CURRENCIES,
    REGISTER_MP_BILLING_ACCOUNTS_NO_MATCH,
    REGISTER_MP_INVALID_SENDER,
    REGISTER_MP_DELETED_CONSUMERS,
    REGISTER_MP_DELETED_ACQUIRING_CONTEXTS,
    REGISTER_MP_DELETED_ACQUIRING_INTEGRATION,
    REGISTER_MP_DELETED_BILLING_CONTEXT,
    REGISTER_MP_DELETED_BILLING_INTEGRATION,
    REGISTER_MP_NEGATIVE_TO_PAY,
    INTEGRATION_NO_BILLINGS_ERROR,
    CONTEXT_ALREADY_HAVE_ACTIVE_CONTEXT,
    PAYMENT_NO_PAIRED_RECEIPT,
    PAYMENT_NO_PAIRED_FROZEN_RECEIPT,
    PAYMENT_CONTEXT_ORGANIZATION_NOT_MATCH,
    PAYMENT_NOT_ALLOWED_TRANSITION,
    PAYMENT_MISSING_REQUIRED_FIELDS,
    PAYMENT_FROZEN_FIELD_INCLUDED,
    PAYMENT_NO_PAIRED_CONTEXT,
    PAYMENT_TOO_BIG_IMPLICIT_FEE,
    PAYMENT_NO_SUPPORTED_CONTEXT,
    PAYMENT_RECIPIENT_MISMATCH,
    MULTIPAYMENT_EMPTY_PAYMENTS,
    MULTIPAYMENT_TOO_BIG_IMPLICIT_FEE,
    MULTIPAYMENT_NO_RECEIPT_PAYMENTS,
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
    PAYMENT_EXPLICIT_FEE_AND_CHARGE_SAME_TIME,
    PAYMENT_OVERRIDING_EXPLICIT_FEES_MUST_BE_EXPLICIT,
}