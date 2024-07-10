const { GQLErrorCode: { BAD_USER_INPUT  } } = require('@open-condo/keystone/errors')

const { NOT_FOUND, NOT_UNIQUE } = require('@condo/domains/common/constants/errors')

const ERRORS = {
    FAILED_TO_GET_INFORMATION_ABOUT_ORGANIZATION: {
        mutation: 'registerPaymentRule',
        variable: ['data', 'tin'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'No information about organization from tin',
        messageForUser: 'api.user.registerPaymentRule.FAILED_TO_GET_INFORMATION_ABOUT_ORGANIZATION',
    },
    FAILED_TO_GET_INFORMATION_ABOUT_BANK: {
        mutation: 'registerPaymentRule',
        variable: ['data', 'routingNumber'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'No information about bank from routingNumber',
        messageForUser: 'api.user.registerPaymentRule.FAILED_TO_GET_INFORMATION_ABOUT_BANK',
    },
    ACQUIRING_CONTEXT_CHECK_FAILED: {
        mutation: 'registerPaymentRule',
        variable: ['data', 'acquiringIntegrationContext', 'id'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Acquiring context needs to be active and in Finished status',
        messageForUser: 'api.user.registerPaymentRule.ACQUIRING_CONTEXT_CHECK_FAILED',
    },
    DUPLICATE_MARKET_PLACE_SCOPE: {
        mutation: 'registerPaymentRule',
        variable: ['data', 'marketPlaceScope'],
        code: BAD_USER_INPUT,
        type: NOT_UNIQUE,
        message: 'Attempt to create same market place scope for different payment rule',
        messageForUser: 'api.user.registerPaymentRule.DUPLICATE_MARKET_PLACE_SCOPE',
    },
    DUPLICATE_BILLING_SCOPE: {
        mutation: 'registerPaymentRule',
        variable: ['data', 'billingScope'],
        code: BAD_USER_INPUT,
        type: NOT_UNIQUE,
        message: 'Attempt to create same billing scope for different payment rule',
        messageForUser: 'api.user.registerPaymentRule.DUPLICATE_BILLING_SCOPE',
    },
}

module.exports = {
    ERRORS,
}