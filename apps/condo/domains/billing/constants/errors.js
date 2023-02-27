const { WRONG_FORMAT } = require('@condo/domains/common/constants/errors')

const BILLING_INTEGRATION_WRONG_GROUP_FORMAT_ERROR = `[${WRONG_FORMAT}:BillingIntegration:group] group should be a sequence of lowercase latin characters`

module.exports = {
    BILLING_INTEGRATION_WRONG_GROUP_FORMAT_ERROR,
}