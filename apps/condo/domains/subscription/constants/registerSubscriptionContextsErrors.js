const { GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')

const { NOT_FOUND } = require('@condo/domains/common/constants/errors')

const REGISTER_SUBSCRIPTION_CONTEXTS_ERRORS = {
    ORGANIZATION_NOT_FOUND: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'organization'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Organization not found',
        messageForUser: 'api.subscription.registerSubscriptionContexts.ORGANIZATION_NOT_FOUND',
    },
    PRICING_RULE_NOT_FOUND: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'subscriptionPlanPricingRule'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Subscription plan pricing rule not found',
        messageForUser: 'api.subscription.registerSubscriptionContexts.PRICING_RULE_NOT_FOUND',
    },
    INVALID_ORGANIZATION_TYPE: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'organization'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Organization type does not match subscription plan organization type',
        messageForUser: 'api.subscription.registerSubscriptionContexts.INVALID_ORGANIZATION_TYPE',
    },
    TRIAL_NOT_AVAILABLE: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'isTrial'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Trial subscription is not available for this plan',
        messageForUser: 'api.subscription.registerSubscriptionContexts.TRIAL_NOT_AVAILABLE',
    },
    TRIAL_ALREADY_USED: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'isTrial'],
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'Trial subscription for this plan was already activated',
        messageForUser: 'api.subscription.registerSubscriptionContexts.TRIAL_ALREADY_USED',
    },
    MIXED_PRICING_RULE_PERIODS: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'additionalPricingRules'],
        code: BAD_USER_INPUT,
        type: 'MIXED_PRICING_RULE_PERIODS',
        message: 'All pricing rules in a bundle must have the same period',
        messageForUser: 'api.subscription.registerSubscriptionContexts.MIXED_PRICING_RULE_PERIODS',
    },
    DUPLICATE_PLAN_IN_BUNDLE: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'additionalPricingRules'],
        code: BAD_USER_INPUT,
        type: 'DUPLICATE_PLAN_IN_BUNDLE',
        message: 'A bundle cannot contain the same subscription plan more than once',
        messageForUser: 'api.subscription.registerSubscriptionContexts.DUPLICATE_PLAN_IN_BUNDLE',
    },
    MULTIPLE_SERVICE_PLANS_IN_BUNDLE: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'additionalPricingRules'],
        code: BAD_USER_INPUT,
        type: 'MULTIPLE_SERVICE_PLANS_IN_BUNDLE',
        message: 'A bundle can contain at most one service plan',
        messageForUser: 'api.subscription.registerSubscriptionContexts.MULTIPLE_SERVICE_PLANS_IN_BUNDLE',
    },
    FEATURE_ALREADY_IN_PLAN: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'additionalPricingRules'],
        code: BAD_USER_INPUT,
        type: 'FEATURE_ALREADY_IN_PLAN',
        message: 'A feature plan in the bundle is already covered by another plan in the same bundle',
        messageForUser: 'api.subscription.registerSubscriptionContexts.FEATURE_ALREADY_IN_PLAN',
    },
    NO_ACTIVE_SERVICE_SUBSCRIPTION: {
        mutation: 'registerSubscriptionContexts',
        variable: ['data', 'organization'],
        code: BAD_USER_INPUT,
        type: 'NO_ACTIVE_SERVICE_SUBSCRIPTION',
        message: 'Cannot subscribe to a feature plan without an active service subscription',
        messageForUser: 'api.subscription.registerSubscriptionContexts.NO_ACTIVE_SERVICE_SUBSCRIPTION',
    },
    PAYMENT_RECIPIENT_NOT_CONFIGURED: {
        mutation: 'registerSubscriptionContexts',
        code: BAD_USER_INPUT,
        type: NOT_FOUND,
        message: 'SUBSCRIPTION_PAYMENT_RECIPIENT is not configured',
    },
}

module.exports = {
    REGISTER_SUBSCRIPTION_CONTEXTS_ERRORS,
}
