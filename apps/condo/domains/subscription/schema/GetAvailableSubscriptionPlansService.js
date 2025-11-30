/**
 * Service to get available subscription plans for an organization with calculated prices
 */

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { GQLCustomSchema, find } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/subscription/access/GetAvailableSubscriptionPlansService')
const { SUBSCRIPTION_PERIODS } = require('@condo/domains/subscription/constants')
const { calculateSubscriptionPrice } = require('@condo/domains/subscription/utils/calculateSubscriptionPrice')

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
            type: `type SubscriptionPlanPrice {
                period: String!
                basePrice: String!
                currentPrice: String!
                currencyCode: String
            }`,
        },
        {
            access: true,
            type: `type AvailableSubscriptionPlan {
                plan: SubscriptionPlan!
                prices: [SubscriptionPlanPrice!]!
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
            schema: 'getAvailableSubscriptionPlans(organization: OrganizationWhereUniqueInput!): GetAvailableSubscriptionPlansOutput',
            resolver: async (parent, args, context) => {
                const { organization: organizationInput } = args

                const [organization] = await find('Organization', {
                    id: organizationInput.id,
                    deletedAt: null,
                })
                if (!organization) {
                    throw new GQLError(ERRORS.ORGANIZATION_NOT_FOUND, context)
                }
                
                const plans = await find('SubscriptionPlan', {
                    isActive: true,
                    organizationType: organization.type,
                    deletedAt: null,
                })

                const result = []

                for (const plan of plans) {
                    const prices = []

                    for (const period of SUBSCRIPTION_PERIODS) {
                        const priceData = await calculateSubscriptionPrice(plan.id, period, organization)
                        if (!priceData) continue

                        const { basePrice, finalPrice, currencyCode } = priceData

                        prices.push({ period, basePrice, currentPrice: finalPrice, currencyCode })
                    }

                    result.push({ plan, prices })
                }

                return { plans: result }
            },
        },
    ],
})

module.exports = {
    GetAvailableSubscriptionPlansService,
}
