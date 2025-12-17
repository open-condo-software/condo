const { getById } = require('@open-condo/keystone/schema')

/**
 * Creates a frozen snapshot of a pricing rule for audit purposes.
 * This snapshot preserves the pricing rule state at the moment of subscription creation,
 * allowing support to track historical pricing even if the rule changes later.
 *
 * @param {string} pricingRuleId - ID of the SubscriptionPlanPricingRule
 * @returns {Promise<Object>} Frozen pricing rule data with dv wrapper
 */
async function freezePricingRule (pricingRuleId) {
    const pricingRule = await getById('SubscriptionPlanPricingRule', pricingRuleId)
    const subscriptionPlan = await getById('SubscriptionPlan', pricingRule.subscriptionPlan)

    return {
        dv: 1,
        data: {
            ...pricingRule,
            subscriptionPlan,
        },
    }
}

module.exports = {
    freezePricingRule,
}
