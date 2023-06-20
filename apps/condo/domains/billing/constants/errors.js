const { WRONG_FORMAT } = require('@condo/domains/common/constants/errors')

const BILLING_INTEGRATION_EXTENDS_NO_APP_URL_ERROR = '[extendsBillingPage:appUrl:empty] Extends billing page is marked to true, but no appUrl is specified'
const BILLING_INTEGRATION_SINGLE_CONNECT_WAY_ERROR = '[setupUrl:instruction] Billing integration must have 1 and only 1 of these fields filled: [setupUrl, instruction]'
const BILLING_INTEGRATION_WRONG_GROUP_FORMAT_ERROR = `[${WRONG_FORMAT}:BillingIntegration:group] group should be a sequence of lowercase latin characters`

module.exports = {
    BILLING_INTEGRATION_WRONG_GROUP_FORMAT_ERROR,
    BILLING_INTEGRATION_EXTENDS_NO_APP_URL_ERROR,
    BILLING_INTEGRATION_SINGLE_CONNECT_WAY_ERROR,
}