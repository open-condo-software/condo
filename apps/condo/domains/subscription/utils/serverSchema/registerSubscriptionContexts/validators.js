const dayjs = require('dayjs')
const get = require('lodash/get')

const { GQLError } = require('@open-condo/keystone/errors')

const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const {
    SUBSCRIPTION_PLAN_TYPE_SERVICE,
    SUBSCRIPTION_PLAN_TYPE_FEATURE,
} = require('@condo/domains/subscription/constants')
const { REGISTER_SUBSCRIPTION_CONTEXTS_ERRORS: ERRORS } = require('@condo/domains/subscription/constants/registerSubscriptionContextsErrors')
const { isPlanSubsetOf } = require('@condo/domains/subscription/utils/isPlanSubsetOf')

/**
 * Validates the requested subscriptions as a bundle:
 * - every plan's organizationType matches the organization
 * - no plan appears twice
 * - at most one service plan
 * - no bundled feature plan is already covered by another plan in the bundle
 * - a feature-only bundle requires an already active service subscription
 *
 * @param {object} context - keystone context, used for GQLError
 * @param {object} params
 * @param {Array<{ rule: object, plan: object }>} params.subscriptions
 * @param {object} params.organization
 */
async function validateBundle (context, { subscriptions, organization }) {
    for (const { plan } of subscriptions) {
        if (plan.organizationType && plan.organizationType !== organization.type) {
            throw new GQLError(ERRORS.INVALID_ORGANIZATION_TYPE, context)
        }
    }

    const planIds = subscriptions.map(subscription => subscription.plan.id)
    if (new Set(planIds).size !== planIds.length) {
        throw new GQLError(ERRORS.DUPLICATE_PLAN_IN_BUNDLE, context)
    }

    const serviceSubscriptions = subscriptions.filter(subscription => subscription.plan.planType === SUBSCRIPTION_PLAN_TYPE_SERVICE)
    if (serviceSubscriptions.length > 1) {
        throw new GQLError(ERRORS.MULTIPLE_SERVICE_PLANS_IN_BUNDLE, context)
    }

    const featureSubscriptions = subscriptions.filter(subscription => subscription.plan.planType === SUBSCRIPTION_PLAN_TYPE_FEATURE)
    for (const featureSubscription of featureSubscriptions) {
        for (const otherSubscription of subscriptions) {
            if (otherSubscription.plan.id === featureSubscription.plan.id) continue
            if (isPlanSubsetOf(featureSubscription.plan, otherSubscription.plan)) {
                throw new GQLError(ERRORS.FEATURE_ALREADY_IN_PLAN, context)
            }
        }
    }

    if (featureSubscriptions.length > 0 && serviceSubscriptions.length === 0) {
        const organizationData = await Organization.getOne(context, { id: organization.id }, 'id subscription { activeSubscriptionEndAt }')
        const activeSubscriptionEndAt = get(organizationData, ['subscription', 'activeSubscriptionEndAt'])
        const hasActiveServiceSubscription = activeSubscriptionEndAt && dayjs(activeSubscriptionEndAt).isAfter(dayjs().startOf('day'))
        if (!hasActiveServiceSubscription) {
            throw new GQLError(ERRORS.NO_ACTIVE_SERVICE_SUBSCRIPTION, context)
        }
    }
}

/**
 * All pricing rules in a paid bundle must share the same billing period.
 * Throws MIXED_PRICING_RULE_PERIODS otherwise.
 *
 * @param {Array<{ rule: object }>} subscriptions
 * @param {object} basePricingRule
 * @param {object} context - keystone context
 */
function validateUniformPeriod (subscriptions, basePricingRule, context) {
    const period = basePricingRule.period
    for (const { rule } of subscriptions) {
        if (rule.period !== period) {
            throw new GQLError(ERRORS.MIXED_PRICING_RULE_PERIODS, context)
        }
    }
}

module.exports = {
    validateBundle,
    validateUniformPeriod,
}
