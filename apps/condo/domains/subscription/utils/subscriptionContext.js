/**
 * Utility functions for working with subscription contexts
 */

const dayjs = require('dayjs')

const conf = require('@open-condo/config')

/**
 * Builds the direct payment URL for card payments by appending organization and
 * provider query params. Returns null when there is no base url. Used both by
 * registerSubscriptionContexts and by the recurrent payments cron, which retries
 * a card charge on an existing invoice.
 *
 * @param {string|null} directPaymentUrl
 * @param {string} organizationId
 * @returns {string|null}
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

/**
 * Calculates the start date for a new subscription based on existing contexts.
 * If there are active contexts that end in the future, the new subscription
 * will start from the latest end date. Otherwise, it starts from today.
 * 
 * @param {Array} existingContexts - Array of existing subscription contexts
 * @returns {Object} - dayjs object representing the start date
 */
function calculateSubscriptionStartDate (existingContexts) {
    const today = dayjs().startOf('day')
    let startAt = today
    
    if (!existingContexts || existingContexts.length === 0) {
        return startAt
    }

    const sortedContexts = existingContexts
        .filter(ctx => ctx.endAt)
        .sort((a, b) => dayjs(b.endAt).diff(dayjs(a.endAt)))

    if (sortedContexts.length > 0) {
        const lastContext = sortedContexts[0]
        const lastEndAt = dayjs(lastContext.endAt).startOf('day')
        if (lastEndAt.isAfter(today)) {
            startAt = lastEndAt
        }
    }

    return startAt
}

module.exports = {
    buildDirectPaymentUrl,
    selectBestSubscriptionContext,
    calculateSubscriptionStartDate,
}
