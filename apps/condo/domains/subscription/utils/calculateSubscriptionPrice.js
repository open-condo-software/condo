/**
 * Utility function to calculate subscription price based on pricing rules
 */

const { PRICING_RULE_TYPE } = require('@condo/domains/subscription/constants')
const { PricingRule, SubscriptionPlan } = require('@condo/domains/subscription/utils/serverSchema')

/**
 * Calculate subscription price for an organization and plan
 * @param {Object} context - Keystone context
 * @param {string} organizationId - Organization ID
 * @param {string} subscriptionPlanId - Subscription plan ID
 * @param {Object} organization - Organization object (optional, will be fetched if not provided)
 * @returns {Object} { basePrice, finalPrice, appliedRules }
 */
async function calculateSubscriptionPrice (context, organizationId, subscriptionPlanId, organization = null) {
    // Get subscription plan
    const [plan] = await SubscriptionPlan.getAll(context, {
        id: subscriptionPlanId,
        deletedAt: null,
    }, { first: 1 })

    if (!plan) {
        throw new Error('Subscription plan not found')
    }

    // Get organization if not provided
    if (!organization) {
        const { Organization } = require('@condo/domains/organization/utils/serverSchema')
        const [org] = await Organization.getAll(context, {
            id: organizationId,
            deletedAt: null,
        }, { first: 1 })
        organization = org
    }

    if (!organization) {
        throw new Error('Organization not found')
    }

    const basePrice = parseFloat(plan.price)
    let currentPrice = basePrice
    const appliedRules = []
    const now = new Date()

    // Get all active pricing rules for this plan or all plans
    const rules = await PricingRule.getAll(context, {
        OR: [
            { subscriptionPlan: { id: subscriptionPlanId } },
            { subscriptionPlan_is_null: true },
        ],
        isActive: true,
        deletedAt: null,
    }, {
        sortBy: ['priority_DESC'],
    })

    for (const rule of rules) {
        // Check time range
        if (rule.validFrom && new Date(rule.validFrom) > now) continue
        if (rule.validTo && new Date(rule.validTo) < now) continue

        // Check specific organization
        if (rule.organization && rule.organization !== organizationId) {
            continue
        }

        // Check organization features (all must be present)
        if (rule.organizationFeatures && rule.organizationFeatures.length > 0) {
            const orgFeatures = organization.features || []
            const hasAllFeatures = rule.organizationFeatures.every(
                f => orgFeatures.includes(f)
            )
            if (!hasAllFeatures) continue
        }

        // Apply rule
        const priceBefore = currentPrice

        if (rule.ruleType === PRICING_RULE_TYPE.PERCENTAGE_DISCOUNT) {
            const discount = parseFloat(rule.discountPercent) || 0
            currentPrice = currentPrice * (1 - discount / 100)
        } else if (rule.ruleType === PRICING_RULE_TYPE.FIXED_DISCOUNT) {
            const discount = parseFloat(rule.discountAmount) || 0
            currentPrice = Math.max(0, currentPrice - discount)
        } else if (rule.ruleType === PRICING_RULE_TYPE.FIXED_PRICE) {
            currentPrice = parseFloat(rule.fixedPrice) || 0
        }

        appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.ruleType,
            ...(rule.discountPercent && { discountPercent: String(rule.discountPercent) }),
            ...(rule.discountAmount && { discountAmount: String(rule.discountAmount) }),
            ...(rule.fixedPrice !== null && rule.fixedPrice !== undefined && { fixedPrice: String(rule.fixedPrice) }),
            priceBefore: priceBefore.toFixed(2),
            priceAfter: currentPrice.toFixed(2),
            appliedAt: now.toISOString(),
        })

        // fixed_price stops further processing
        if (rule.ruleType === PRICING_RULE_TYPE.FIXED_PRICE) {
            break
        }
    }

    return {
        basePrice: basePrice.toFixed(2),
        finalPrice: currentPrice.toFixed(2),
        appliedRules,
    }
}

module.exports = {
    calculateSubscriptionPrice,
}
