/**
 * Service to get available subscription plans for an organization with calculated prices
 */

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const access = require('@condo/domains/subscription/access/GetAvailableSubscriptionPlansService')
const { PRICING_RULE_TYPE } = require('@condo/domains/subscription/constants')
const { calculateSubscriptionPrice } = require('@condo/domains/subscription/utils/calculateSubscriptionPrice')
const { SubscriptionPlan, PricingRule } = require('@condo/domains/subscription/utils/serverSchema')

const ERRORS = {
    ORGANIZATION_NOT_FOUND: {
        code: BAD_USER_INPUT,
        type: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
    },
}

const GetAvailableSubscriptionPlansService = new GQLCustomSchema('GetAvailableSubscriptionPlansService', {
    types: [
        {
            access: true,
            type: `type AvailableSubscriptionPlan {
                plan: SubscriptionPlan!
                basePrice: String!
                currentPrice: String!
                discount: String
                appliedRules: JSON
                hasPromotion: Boolean!
                promotionText: String
                promotionPrice: String
                promotionDiscount: String
            }`,
        },
        {
            access: true,
            type: `type GetAvailableSubscriptionPlansOutput {
                plans: [AvailableSubscriptionPlan!]!
            }`,
        },
    ],

    queries: [
        {
            access: access.canGetAvailableSubscriptionPlans,
            schema: 'getAvailableSubscriptionPlans(organizationId: ID!): GetAvailableSubscriptionPlansOutput',
            resolver: async (parent, args, context) => {
                const { organizationId } = args

                // Get organization
                const [organization] = await Organization.getAll(context, {
                    id: organizationId,
                    deletedAt: null,
                }, { first: 1 })

                if (!organization) {
                    throw new GQLError(ERRORS.ORGANIZATION_NOT_FOUND, context)
                }

                // Get all active plans for this organization type
                const plans = await SubscriptionPlan.getAll(context, {
                    isActive: true,
                    organizationType: organization.type,
                    deletedAt: null,
                }, {
                    sortBy: ['type_ASC', 'period_ASC'],
                })

                // Get promotional rules (canBePromoted = true)
                const promotionalRules = await PricingRule.getAll(context, {
                    isActive: true,
                    canBePromoted: true,
                    deletedAt: null,
                })

                const now = new Date()
                const orgFeatures = organization.features || []

                const result = await Promise.all(plans.map(async (plan) => {
                    // Calculate current price for this organization
                    const priceCalculation = await calculateSubscriptionPrice(
                        context,
                        organizationId,
                        plan.id,
                        organization
                    )

                    const basePrice = priceCalculation.basePrice
                    const currentPrice = priceCalculation.finalPrice
                    const discount = basePrice !== currentPrice
                        ? ((parseFloat(basePrice) - parseFloat(currentPrice)) / parseFloat(basePrice) * 100).toFixed(0) + '%'
                        : null

                    // Find promotional rules that DON'T currently apply but could
                    let hasPromotion = false
                    let promotionText = null
                    let promotionPrice = null
                    let promotionDiscount = null

                    for (const rule of promotionalRules) {
                        // Check if rule applies to this plan
                        if (rule.subscriptionPlan && rule.subscriptionPlan !== plan.id) continue

                        // Check time range
                        if (rule.validFrom && new Date(rule.validFrom) > now) continue
                        if (rule.validTo && new Date(rule.validTo) < now) continue

                        // Check if organization already qualifies (then it's not a promotion)
                        const alreadyQualifies = !rule.organizationFeatures ||
                            rule.organizationFeatures.length === 0 ||
                            rule.organizationFeatures.every(f => orgFeatures.includes(f))

                        if (alreadyQualifies) continue

                        // This is a promotion the organization could get
                        hasPromotion = true
                        promotionText = rule.promotionText

                        // Calculate what price would be with this rule
                        let promoPrice = parseFloat(basePrice)
                        if (rule.ruleType === PRICING_RULE_TYPE.PERCENTAGE_DISCOUNT) {
                            promoPrice = promoPrice * (1 - parseFloat(rule.discountPercent) / 100)
                        } else if (rule.ruleType === PRICING_RULE_TYPE.FIXED_DISCOUNT) {
                            promoPrice = Math.max(0, promoPrice - parseFloat(rule.discountAmount))
                        } else if (rule.ruleType === PRICING_RULE_TYPE.FIXED_PRICE) {
                            promoPrice = parseFloat(rule.fixedPrice)
                        }

                        promotionPrice = promoPrice.toFixed(2)
                        promotionDiscount = ((parseFloat(basePrice) - promoPrice) / parseFloat(basePrice) * 100).toFixed(0) + '%'

                        break // Take first matching promotion
                    }

                    return {
                        plan,
                        basePrice,
                        currentPrice,
                        discount,
                        appliedRules: priceCalculation.appliedRules,
                        hasPromotion,
                        promotionText,
                        promotionPrice,
                        promotionDiscount,
                    }
                }))

                return { plans: result }
            },
        },
    ],
})

module.exports = {
    GetAvailableSubscriptionPlansService,
}
