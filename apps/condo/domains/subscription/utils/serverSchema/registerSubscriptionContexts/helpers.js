const conf = require('@open-condo/config')

const { SUBSCRIPTION_PLAN_TYPE_SERVICE } = require('@condo/domains/subscription/constants')

/**
 * Builds the direct payment URL for card payments by appending organization and
 * provider query params. Returns null when there is no base url.
 */
function buildDirectPaymentUrl (directPaymentUrl, organizationId) {
    if (!directPaymentUrl) return null
    const provider = conf['B2B_PAYMENTS_PROVIDER']
    const url = new URL(directPaymentUrl)
    url.searchParams.append('organizationId', organizationId)
    url.searchParams.append('provider', provider)
    return url.toString()
}

/**
 * Picks the requested subscription that drives dates and the invoice: the
 * (single) service plan if present, otherwise the one with the lowest pricing
 * rule id for a stable choice.
 *
 * @param {Array<{ rule: object, plan: object }>} subscriptions
 * @returns {{ rule: object, plan: object }}
 */
function pickBaseSubscription (subscriptions) {
    const serviceSubscription = subscriptions.find(subscription => subscription.plan.planType === SUBSCRIPTION_PLAN_TYPE_SERVICE)
    if (serviceSubscription) return serviceSubscription
    return [...subscriptions].sort((a, b) => (a.rule.id < b.rule.id ? -1 : 1))[0]
}

/**
 * Checks whether an existing bundle (its contexts) is made of exactly the same
 * set of pricing rules as the requested one, regardless of order.
 *
 * @param {Array<{ subscriptionPlanPricingRule: string }>} bundleContexts
 * @param {Array<string>} requestedRuleIds - sorted list of requested pricing rule ids
 * @returns {boolean}
 */
function isSameComposition (bundleContexts, requestedRuleIds) {
    const ruleIds = bundleContexts.map(ctx => ctx.subscriptionPlanPricingRule).sort()
    return ruleIds.length === requestedRuleIds.length && ruleIds.every((id, i) => id === requestedRuleIds[i])
}

module.exports = {
    buildDirectPaymentUrl,
    pickBaseSubscription,
    isSameComposition,
}
