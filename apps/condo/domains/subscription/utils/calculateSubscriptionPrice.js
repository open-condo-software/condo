/**
 * Utility function to calculate subscription price based on pricing rules
 */

const { itemsQuery } = require('@open-condo/keystone/schema')

const { evaluateConditions } = require('./conditionsEvaluator')

/**
 * Calculate subscription price for a plan and period.
 * Returns the first matching rule's price based on priority and conditions.
 *
 * @param {string} subscriptionPlanId - Subscription plan ID
 * @param {string} period - Subscription period (monthly/yearly)
 * @param {Object} organization - Organization
 * @returns {Object|null} { basePrice, finalPrice, currencyCode, appliedRules } or null if no price configured
 */
async function calculateSubscriptionPrice (subscriptionPlanId, period, organization = null) {
    const rules = await itemsQuery('SubscriptionPlanPricingRule', {
        where: {
            subscriptionPlan: { id: subscriptionPlanId },
            period,
            isHidden: false,
            deletedAt: null,
        },
        sortBy: ['priority_DESC'],
    })

    // Build context for conditions evaluation (facts: organizationIds, organizationFeatures)
    const context = {
        organization: organization ? {
            id: organization.id,
            features: organization.features || [],
        } : null,
    }

    for (const rule of rules) {
        if (!await evaluateConditions(rule.conditions, context)) {
            continue
        }

        const price = parseFloat(rule.price) || 0

        return {
            ruleId: rule.id,
            basePrice: price.toFixed(2),
            finalPrice: price.toFixed(2),
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
    calculateSubscriptionPrice,
}
