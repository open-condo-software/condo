/**
 * Utility function to find matching pricing rule for an organization
 */

const { itemsQuery } = require('@open-condo/keystone/schema')

const { evaluateConditions } = require('./conditionsEvaluator')

/**
 * Find matching pricing rule for a plan, period and organization.
 * Returns the first matching rule's price based on priority and conditions.
 *
 * @param {string} subscriptionPlanId - Subscription plan ID
 * @param {string} period - Subscription period (month/year)
 * @param {Object} organization - Organization (required)
 * @returns {Object|null} { ruleId, price, currencyCode, appliedRules } or null if no matching rule found
 */
async function findMatchingPricingRule (subscriptionPlanId, period, organization) {
    if (!organization) {
        throw new Error('organization is required')
    }

    const rules = await itemsQuery('SubscriptionPlanPricingRule', {
        where: {
            subscriptionPlan: { id: subscriptionPlanId },
            period,
            isHidden: false,
            deletedAt: null,
        },
        sortBy: ['priority_DESC'],
    })

    const context = {
        organization: {
            id: organization.id,
            features: organization.features || [],
        },
    }

    for (const rule of rules) {
        if (!await evaluateConditions(rule.conditions, context)) {
            continue
        }

        return {
            ruleId: rule.id,
            name: rule.name,
            price: rule.price,
            currencyCode: rule.currencyCode,
            appliedRules: [{
                ruleId: rule.id,
                ruleName: rule.name,
            }],
        }
    }

    return null
}

module.exports = {
    findMatchingPricingRule,
}
