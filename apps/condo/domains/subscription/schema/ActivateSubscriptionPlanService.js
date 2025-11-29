/**
 * Service to activate a subscription plan for an organization
 */

const dayjs = require('dayjs')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const access = require('@condo/domains/subscription/access/ActivateSubscriptionPlanService')
const { SUBSCRIPTION_PERIOD } = require('@condo/domains/subscription/constants')
const { calculateSubscriptionPrice } = require('@condo/domains/subscription/utils/calculateSubscriptionPrice')
const { SubscriptionPlan, SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')

const ERRORS = {
    ORGANIZATION_NOT_FOUND: {
        code: BAD_USER_INPUT,
        type: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
    },
    PLAN_NOT_FOUND: {
        code: BAD_USER_INPUT,
        type: 'PLAN_NOT_FOUND',
        message: 'Subscription plan not found or inactive',
    },
    INVALID_ORGANIZATION_TYPE: {
        code: BAD_USER_INPUT,
        type: 'INVALID_ORGANIZATION_TYPE',
        message: 'Plan is not available for this organization type',
    },
}

const ActivateSubscriptionPlanService = new GQLCustomSchema('ActivateSubscriptionPlanService', {
    types: [
        {
            access: true,
            type: `input ActivateSubscriptionPlanInput {
                dv: Int!
                sender: SenderFieldInput!
                organization: OrganizationWhereUniqueInput!
                subscriptionPlan: SubscriptionPlanWhereUniqueInput!
                isTrial: Boolean
            }`,
        },
        {
            access: true,
            type: `type ActivateSubscriptionPlanOutput {
                subscriptionContext: SubscriptionContext!
            }`,
        },
    ],

    mutations: [
        {
            access: access.canActivateSubscriptionPlan,
            schema: 'activateSubscriptionPlan(data: ActivateSubscriptionPlanInput!): ActivateSubscriptionPlanOutput',
            resolver: async (parent, args, context) => {
                const { data } = args
                const { dv, sender, organization: organizationInput, subscriptionPlan: planInput, isTrial = false } = data

                // Get organization
                const [organization] = await Organization.getAll(context, {
                    id: organizationInput.id,
                    deletedAt: null,
                }, { first: 1 })

                if (!organization) {
                    throw new GQLError(ERRORS.ORGANIZATION_NOT_FOUND, context)
                }

                // Get subscription plan
                const [plan] = await SubscriptionPlan.getAll(context, {
                    id: planInput.id,
                    isActive: true,
                    deletedAt: null,
                }, { first: 1 })

                if (!plan) {
                    throw new GQLError(ERRORS.PLAN_NOT_FOUND, context)
                }

                // Check organization type compatibility
                if (plan.organizationType && plan.organizationType !== organization.type) {
                    throw new GQLError(ERRORS.INVALID_ORGANIZATION_TYPE, context)
                }

                // Calculate price
                const priceCalculation = await calculateSubscriptionPrice(
                    context,
                    organization.id,
                    plan.id,
                    organization
                )

                // Determine dates
                const startAt = dayjs().startOf('day')
                const periodDays = plan.period === SUBSCRIPTION_PERIOD.YEARLY ? 365 : 30
                const endAt = startAt.add(periodDays, 'day')

                // Create subscription context
                const subscriptionContext = await SubscriptionContext.create(context, {
                    dv,
                    sender,
                    organization: { connect: { id: organization.id } },
                    subscriptionPlan: { connect: { id: plan.id } },
                    startAt: startAt.toISOString(),
                    endAt: endAt.toISOString(),
                    basePrice: priceCalculation.basePrice,
                    calculatedPrice: priceCalculation.finalPrice,
                    appliedRules: priceCalculation.appliedRules,
                    isTrial,
                })

                return {
                    subscriptionContext,
                }
            },
        },
    ],
})

module.exports = {
    ActivateSubscriptionPlanService,
}
