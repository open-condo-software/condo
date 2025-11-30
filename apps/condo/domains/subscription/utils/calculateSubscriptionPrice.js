/**
 * Utility function to calculate subscription price based on pricing rules
 */

const { itemsQuery } = require('@open-condo/keystone/schema')

const { PRICING_RULE_TYPE } = require('@condo/domains/subscription/constants')

/**
 * Calculate subscription price for a plan and period.
 * Rules are applied in order of priority (highest first):
 * - fixed_price: sets/overrides current price (first one also sets basePrice)
 * - percentage_discount: applies % discount to current price
 * - fixed_discount: subtracts fixed amount from current price
 *
 * @param {string} subscriptionPlanId - Subscription plan ID
 * @param {string} period - Subscription period (monthly/yearly)
 * @param {Object} organization - Organization object (optional, for org-specific rules)
 * @returns {Object|null} { basePrice, finalPrice, currencyCode, appliedRules } or null if no base price configured
 */
async function calculateSubscriptionPrice (subscriptionPlanId, period, organization = null) {
    const now = new Date()

    // Get pricing rules: either for this specific org or for all orgs (organization = null)
    const rules = await itemsQuery('PricingRule', {
        where: {
            subscriptionPlan: subscriptionPlanId,
            period,
            isActive: true,
            deletedAt: null,
            OR: [
                { organization_is_null: true },
                ...(organization ? [{ organization: organization.id }] : []),
            ],
        },
        sortBy: ['priority_DESC'],
    })

    let basePrice = 0
    let currentPrice = 0
    let currencyCode = null
    const appliedRules = []

    for (const rule of rules) {
        if (rule.validFrom && new Date(rule.validFrom) > now) continue
        if (rule.validTo && new Date(rule.validTo) < now) continue

        if (rule.organizationFeatures?.length > 0) {
            const orgFeatures = organization?.features || []
            if (!rule.organizationFeatures.every(f => orgFeatures.includes(f))) continue
        }

        const priceBefore = currentPrice

        if (rule.ruleType === PRICING_RULE_TYPE.FIXED_PRICE) {
            // Only first matching fixed_price rule sets the price
            if (basePrice === 0) {
                const price = parseFloat(rule.fixedPrice) || 0
                basePrice = price
                currentPrice = price
                currencyCode = rule.currencyCode
            } else {
                continue
            }
        } else if (rule.ruleType === PRICING_RULE_TYPE.PERCENTAGE_DISCOUNT) {
            currentPrice = currentPrice * (1 - (parseFloat(rule.discountPercent) || 0) / 100)
        } else if (rule.ruleType === PRICING_RULE_TYPE.FIXED_DISCOUNT) {
            currentPrice = Math.max(0, currentPrice - (parseFloat(rule.discountAmount) || 0))
        }

        appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.ruleType,
            priceBefore: priceBefore.toFixed(2),
            priceAfter: currentPrice.toFixed(2),
        })
    }

    if (basePrice === 0) {
        return null
    }

    return {
        basePrice: basePrice.toFixed(2),
        finalPrice: currentPrice.toFixed(2),
        currencyCode,
        appliedRules,
    }
}

module.exports = {
    calculateSubscriptionPrice,
}
