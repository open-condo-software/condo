/**
 * Utility function to calculate subscription price based on pricing rules
 */

const { itemsQuery } = require('@open-condo/keystone/schema')

/**
 * Calculate subscription price for a plan and period.
 * Rules are applied in order of priority (highest first):
 * - fixedPrice: sets/overrides current price (first one also sets basePrice)
 * - discountPercent: applies % discount to current price
 *
 * @param {string} subscriptionPlanId - Subscription plan ID
 * @param {string} period - Subscription period (monthly/yearly)
 * @param {Object} organization - Organization object (optional, for org-specific rules)
 * @returns {Object|null} { basePrice, finalPrice, currencyCode, appliedRules } or null if no base price configured
 */
async function calculateSubscriptionPrice (subscriptionPlanId, period, organization = null) {
    // Get pricing rules: either for this specific org or for all orgs (organization = null)
    const rules = await itemsQuery('SubscriptionPlanPricingRule', {
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
        // Check organization features if specified
        if (rule.organizationFeatures?.length > 0) {
            const orgFeatures = organization?.features || []
            if (!rule.organizationFeatures.every(f => orgFeatures.includes(f))) continue
        }

        const priceBefore = currentPrice
        const hasFixedPrice = rule.fixedPrice !== null && rule.fixedPrice !== undefined
        const hasDiscountPercent = rule.discountPercent !== null && rule.discountPercent !== undefined

        if (hasFixedPrice) {
            // Only first matching fixed_price rule sets the price
            if (basePrice === 0) {
                const price = parseFloat(rule.fixedPrice) || 0
                basePrice = price
                currentPrice = price
                currencyCode = rule.currencyCode
            } else {
                continue
            }
        } else if (hasDiscountPercent) {
            currentPrice = currentPrice * (1 - (parseFloat(rule.discountPercent) || 0) / 100)
        }

        appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: hasFixedPrice ? 'fixed_price' : 'percentage_discount',
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
