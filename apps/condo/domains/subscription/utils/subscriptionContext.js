/**
 * Utility functions for working with subscription contexts
 */

const dayjs = require('dayjs')

/**
 * Selects the best subscription context from an array of contexts.
 * Selection criteria:
 * 1. Higher plan priority is better
 * 2. If priorities are equal, non-trial subscriptions are preferred over trial
 * 3. If priorities and trial status are equal, later startAt is better
 * 
 * @param {Array} contexts - Array of subscription contexts with subscriptionPlan populated
 * @returns {Object|null} - The best subscription context or null if array is empty
 */
function selectBestSubscriptionContext (contexts) {
    if (!contexts || contexts.length === 0) {
        return null
    }

    if (contexts.length === 1) {
        return contexts[0]
    }

    const sorted = [...contexts].sort((a, b) => {
        const priorityA = a.subscriptionPlan?.priority || 0
        const priorityB = b.subscriptionPlan?.priority || 0

        if (priorityA !== priorityB) {
            return priorityB - priorityA
        }
        
        const isTrialA = a.isTrial === true
        const isTrialB = b.isTrial === true

        if (isTrialA !== isTrialB) {
            return isTrialA ? 1 : -1
        }

        // Handle missing startAt values
        if (!a.startAt && !b.startAt) return 0
        if (!a.startAt) return 1
        if (!b.startAt) return -1

        return dayjs(b.startAt).diff(dayjs(a.startAt))
    })

    return sorted[0]
}


module.exports = {
    selectBestSubscriptionContext,
}
