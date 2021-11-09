const REGISTER_MP_EMPTY_INPUT = '[groupedReceipts:empty] GroupedReceipts was empty'
const REGISTER_MP_EMPTY_RECEIPTS = '[groupedReceipts:receiptsIds:empty] Each group of receipts should contain at least 1 receipt'
const REGISTER_MP_CONSUMERS_DUPLICATE = '[groupedReceipts:consumerId:duplicate] There are some groupedReceipts with same consumerId'
const REGISTER_MP_RECEIPTS_DUPLICATE = '[groupedReceipts:consumerId:duplicate] Found duplicated receiptsIds. Note, each receipt can only occur in single ServiceConsumer per mutation run and cannot be noticed twice'
const REGISTER_MP_REAL_CONSUMER_MISMATCH = '[groupedReceipts:consumerId:nonExistingConsumer] Cannot find all specified ServiceConsumers.'
const REGISTER_MP_NO_ACQUIRING_CONSUMERS = '[serviceConsumer:noAcquiringContext] Some of ServiceConsumers doesn\'t have Acquiring context.'
const REGISTER_MP_MULTIPLE_INTEGRATIONS = '[serviceConsumer:acquiringContext:multipleIntegrations] Listed consumerIds are linked to different acquiring integrations'
const REGISTER_MP_CANNOT_GROUP_RECEIPTS = '[acquiringIntegration:canGroupReceipts:false:multipleReceipts] receiptsIds total length was > 1, but acquiring integration cannot group billing receipts'
const REGISTER_MP_UNSUPPORTED_BILLING = '[acquiringIntegration:supportedBillingIntegrations:notIncludesReceiptBilling] Some of billing receipts are not supported by ServiceConsumer\'s acquiring integration'
const REGISTER_MP_REAL_RECEIPTS_MISMATCH = '[groupedReceipts:receiptsIds:nonExistingReceipt] Cannot find all specified BillingReceipts.'
const REGISTER_MP_DELETED_RECEIPTS = '[groupedReceipts:receiptsIds:deletedReceipt] Cannot pay for deleted receipts.'
const REGISTER_MP_MULTIPLE_CURRENCIES = '[groupedReceipts:receiptsIds:context:integration:currencyCode:multipleFound] Cannot pay for receipts with multiple currencies.'
const REGISTER_MP_BILLING_ACCOUNTS_NO_MATCH = '[groupedReceipts:receiptsIds:noCommonBillingAccount] Billing receipt with specified id doesn\'t have common billing account with specified ServiceConsumer'


module.exports = {
    REGISTER_MP_EMPTY_INPUT,
    REGISTER_MP_EMPTY_RECEIPTS,
    REGISTER_MP_CONSUMERS_DUPLICATE,
    REGISTER_MP_RECEIPTS_DUPLICATE,
    REGISTER_MP_REAL_CONSUMER_MISMATCH,
    REGISTER_MP_NO_ACQUIRING_CONSUMERS,
    REGISTER_MP_MULTIPLE_INTEGRATIONS,
    REGISTER_MP_CANNOT_GROUP_RECEIPTS,
    REGISTER_MP_UNSUPPORTED_BILLING,
    REGISTER_MP_REAL_RECEIPTS_MISMATCH,
    REGISTER_MP_DELETED_RECEIPTS,
    REGISTER_MP_MULTIPLE_CURRENCIES,
    REGISTER_MP_BILLING_ACCOUNTS_NO_MATCH,
}