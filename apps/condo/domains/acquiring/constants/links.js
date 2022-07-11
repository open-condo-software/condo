// Used to navigate users to web page, where shown amount + explicit fee + confirm button
const WEB_VIEW_PATH = '/pay/[id]'
// Used to get explicit fee + available payment methods such as Apple Pay, web-view and etc
const FEE_CALCULATION_PATH = '/api/fee/[id]'
const DIRECT_PAYMENT_PATH = '/api/pay/[id]'
const GET_CARD_TOKENS_PATH = '/api/clients/[id]/card-tokens'

module.exports = {
    WEB_VIEW_PATH,
    FEE_CALCULATION_PATH,
    DIRECT_PAYMENT_PATH,
    GET_CARD_TOKENS_PATH,
}