const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const ACTIVATE_SUBSCRIPTION_CONTEXT_ERRORS = {
    SUBSCRIPTION_CONTEXT_NOT_FOUND: {
        mutation: 'activateSubscriptionContext',
        variable: ['data', 'subscriptionContext'],
        code: BAD_USER_INPUT,
        type: 'SUBSCRIPTION_CONTEXT_NOT_FOUND',
        message: 'SubscriptionContext not found',
    },
    SUBSCRIPTION_CONTEXT_INVALID_STATUS: {
        mutation: 'activateSubscriptionContext',
        variable: ['data', 'subscriptionContext'],
        code: BAD_USER_INPUT,
        type: 'SUBSCRIPTION_CONTEXT_INVALID_STATUS',
        message: 'SubscriptionContext must have status CREATED',
    },
    INVOICE_NOT_FOUND: {
        mutation: 'activateSubscriptionContext',
        variable: ['data', 'subscriptionContext'],
        code: BAD_USER_INPUT,
        type: 'INVOICE_NOT_FOUND',
        message: 'Invoice not found for SubscriptionContext',
    },
    INVOICE_NOT_PAID: {
        mutation: 'activateSubscriptionContext',
        variable: ['data', 'subscriptionContext'],
        code: BAD_USER_INPUT,
        type: 'INVOICE_NOT_PAID',
        message: 'Invoice is not paid',
    },
}

module.exports = {
    ACTIVATE_SUBSCRIPTION_CONTEXT_ERRORS,
}
