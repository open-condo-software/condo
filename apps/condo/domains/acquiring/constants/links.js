// Used to navigate users to web page, where shown amount + explicit fee + confirm button
const WEB_VIEW_PATH = '/pay/[id]'
// Used to get explicit fee + available payment methods such as Apple Pay, web-view and etc
const FEE_CALCULATION_PATH = '/api/get_fee/[id]'

module.exports = {
    WEB_VIEW_PATH,
    FEE_CALCULATION_PATH,
}