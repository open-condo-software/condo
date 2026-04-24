const { SUBSCRIPTION_PLAN_FEATURES } = require('@condo/domains/subscription/constants')

/**
 * Checks whether subPlan is fully included in superPlan.
 * subPlan is a subset of superPlan when every feature flag, B2B app, and B2C app
 * enabled in subPlan is also present in superPlan.
 *
 * @param {object} subPlan
 * @param {object} superPlan
 * @returns {boolean}
 */
function isPlanSubsetOf (subPlan, superPlan) {
    const featuresAreSubset = SUBSCRIPTION_PLAN_FEATURES.every(
        feature => !subPlan[feature] || superPlan[feature]
    )
    if (!featuresAreSubset) return false

    const subB2BApps = Array.isArray(subPlan.enabledB2BApps) ? subPlan.enabledB2BApps : []
    const superB2BApps = Array.isArray(superPlan.enabledB2BApps) ? superPlan.enabledB2BApps : []
    if (!subB2BApps.every(appId => superB2BApps.includes(appId))) return false

    const subB2CApps = Array.isArray(subPlan.enabledB2CApps) ? subPlan.enabledB2CApps : []
    const superB2CApps = Array.isArray(superPlan.enabledB2CApps) ? superPlan.enabledB2CApps : []
    if (!subB2CApps.every(appId => superB2CApps.includes(appId))) return false

    return true
}

module.exports = { isPlanSubsetOf }
