/**
 * Service to activate a trial subscription for an organization
 */

const dayjs = require('dayjs')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { GQLCustomSchema, find } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/subscription/access/ActivateSubscriptionPlanService')
const { SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')

const TRIAL_PERIOD_DAYS = 14

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
    TRIAL_ALREADY_USED: {
        code: BAD_USER_INPUT,
        type: 'TRIAL_ALREADY_USED',
        message: 'Trial subscription for this plan has already been used',
    },
    PAID_SUBSCRIPTION_NOT_SUPPORTED: {
        code: BAD_USER_INPUT,
        type: 'PAID_SUBSCRIPTION_NOT_SUPPORTED',
        message: 'Paid subscriptions are not yet supported through this service. Contact support',
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
                isTrial: Boolean!
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
                const { dv, sender, organization: organizationInput, subscriptionPlan: planInput, isTrial } = data

                // Only trial subscriptions supported for now
                if (!isTrial) {
                    throw new GQLError(ERRORS.PAID_SUBSCRIPTION_NOT_SUPPORTED, context)
                }

                const [organization] = await find('Organization', {
                    id: organizationInput.id,
                    deletedAt: null,
                })
                if (!organization) {
                    throw new GQLError(ERRORS.ORGANIZATION_NOT_FOUND, context)
                }

                const [plan] = await find('SubscriptionPlan', {
                    id: planInput.id,
                    isActive: true,
                    deletedAt: null,
                })
                if (!plan) {
                    throw new GQLError(ERRORS.PLAN_NOT_FOUND, context)
                }

                // Check organization type compatibility
                if (plan.organizationType && plan.organizationType !== organization.type) {
                    throw new GQLError(ERRORS.INVALID_ORGANIZATION_TYPE, context)
                }

                // Check if trial already used for this plan
                const [existingTrial] = await find('SubscriptionContext', {
                    organization: organization.id,
                    subscriptionPlan: plan.id,
                    isTrial: true,
                    deletedAt: null,
                })

                if (existingTrial) {
                    throw new GQLError(ERRORS.TRIAL_ALREADY_USED, context)
                }

                // Trial dates
                const startAt = dayjs().startOf('day')
                const endAt = startAt.add(TRIAL_PERIOD_DAYS, 'day')

                // Create trial subscription context
                const subscriptionContext = await SubscriptionContext.create(context, {
                    dv,
                    sender,
                    organization: { connect: { id: organization.id } },
                    subscriptionPlan: { connect: { id: plan.id } },
                    startAt: startAt.toISOString(),
                    endAt: endAt.toISOString(),
                    isTrial: true,
                })

                return { subscriptionContext }
            },
        },
    ],
})

module.exports = {
    ActivateSubscriptionPlanService,
}
