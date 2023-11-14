// Used to navigate users to web page, where shown amount + explicit fee + confirm button
const WEB_VIEW_PATH = '/pay/[id]'
// Used to get explicit fee + available payment methods such as Apple Pay, web-view and etc
const FEE_CALCULATION_PATH = '/api/fee/[id]'
const DIRECT_PAYMENT_PATH = '/api/pay/[id]'
const GET_CARD_TOKENS_PATH = '/api/clients/[id]/card-tokens'
const ANONYMOUS_PAYMENT_PATH = '/api/anonymous/pay/[id]'
const PAYMENT_LINK_PATH = '/payment-link'

const PAYMENT_LINK_QP = {
    acquiringIntegrationContextQp: 'aic',
    successUrlQp: 'su',
    failureUrlQp: 'fu',
    billingReceiptQp: 'br',
    invoiceQp: 'i',
    currencyCodeQp: 'cc',
    amountQp: 'a',
    periodQp: 'p',
    accountNumberQp: 'an',
}

module.exports = {
    WEB_VIEW_PATH,
    FEE_CALCULATION_PATH,
    DIRECT_PAYMENT_PATH,
    GET_CARD_TOKENS_PATH,
    ANONYMOUS_PAYMENT_PATH,
    PAYMENT_LINK_PATH,
    PAYMENT_LINK_QP,
}
