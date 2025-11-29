const SUBSCRIPTION_PAYMENT_CURRENCY = {
    RUB: 'RUB',
}

const SBBOL_YEARLY_SUBSCRIPTION_PRICE = 1.0

// Subscription plan types
const SUBSCRIPTION_TYPE = {
    BASIC: 'basic',
    EXTENDED: 'extended',
}
const SUBSCRIPTION_TYPES = Object.values(SUBSCRIPTION_TYPE)

// Subscription type priority (higher = better)
const SUBSCRIPTION_TYPE_PRIORITY = {
    [SUBSCRIPTION_TYPE.BASIC]: 1,
    [SUBSCRIPTION_TYPE.EXTENDED]: 2,
}

// Subscription periods
const SUBSCRIPTION_PERIOD = {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
}
const SUBSCRIPTION_PERIODS = Object.values(SUBSCRIPTION_PERIOD)

// Pricing rule types
const PRICING_RULE_TYPE = {
    PERCENTAGE_DISCOUNT: 'percentage_discount',
    FIXED_DISCOUNT: 'fixed_discount',
    FIXED_PRICE: 'fixed_price',
}
const PRICING_RULE_TYPES = Object.values(PRICING_RULE_TYPE)

module.exports = {
    SUBSCRIPTION_PAYMENT_CURRENCY,
    SBBOL_YEARLY_SUBSCRIPTION_PRICE,
    SUBSCRIPTION_TYPE,
    SUBSCRIPTION_TYPES,
    SUBSCRIPTION_TYPE_PRIORITY,
    SUBSCRIPTION_PERIOD,
    SUBSCRIPTION_PERIODS,
    PRICING_RULE_TYPE,
    PRICING_RULE_TYPES,
}