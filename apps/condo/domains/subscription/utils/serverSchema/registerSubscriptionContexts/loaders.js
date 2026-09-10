const { GQLError } = require('@open-condo/keystone/errors')
const { find } = require('@open-condo/keystone/schema')

const { REGISTER_SUBSCRIPTION_CONTEXTS_ERRORS: ERRORS } = require('@condo/domains/subscription/constants/registerSubscriptionContextsErrors')

/**
 * Loads a non-deleted organization by id or throws ORGANIZATION_NOT_FOUND.
 */
async function loadOrganizationOrThrow (context, organizationId) {
    const [organization] = await find('Organization', {
        id: organizationId,
        deletedAt: null,
    })
    if (!organization) {
        throw new GQLError(ERRORS.ORGANIZATION_NOT_FOUND, context)
    }
    return organization
}

/**
 * Resolves pricing rule inputs into the requested subscriptions ({ rule, plan }
 * pairs). Throws PRICING_RULE_NOT_FOUND when the input list is empty, a rule is
 * missing, or a rule points to a missing plan.
 *
 * @returns {Promise<Array<{ rule: object, plan: object }>>}
 */
async function resolveRequestedSubscriptionsOrThrow (context, pricingRuleInputs) {
    if (pricingRuleInputs.length === 0) {
        throw new GQLError(ERRORS.PRICING_RULE_NOT_FOUND, context)
    }

    const subscriptions = []
    for (const ruleInput of pricingRuleInputs) {
        const [rule] = await find('SubscriptionPlanPricingRule', {
            id: ruleInput.id,
            deletedAt: null,
        })
        if (!rule) {
            throw new GQLError(ERRORS.PRICING_RULE_NOT_FOUND, context)
        }
        const [plan] = await find('SubscriptionPlan', {
            id: rule.subscriptionPlan,
            deletedAt: null,
        })
        if (!plan) {
            throw new GQLError(ERRORS.PRICING_RULE_NOT_FOUND, context)
        }
        subscriptions.push({ rule, plan })
    }
    return subscriptions
}

module.exports = {
    loadOrganizationOrThrow,
    resolveRequestedSubscriptionsOrThrow,
}
