const dayjs = require('dayjs')

const { calculateSubscriptionStartDate } = require('@condo/domains/subscription/utils/subscriptionContext')

/**
 * Recomputes the paid subscription period so it starts at payment time rather
 * than registration time: the start date is aligned after any already active
 * paid context, and the length is preserved from the context's original
 * startAt/endAt span.
 *
 * @param {object} subscriptionContext - the context being activated (has startAt / endAt)
 * @param {Array} existingDoneContexts - already active DONE contexts for the same org + plan
 * @returns {{ paidStartAt: object, paidEndAt: object }} dayjs dates
 */
function computePaidPeriod (subscriptionContext, existingDoneContexts) {
    const paidStartAt = calculateSubscriptionStartDate(existingDoneContexts)
    const periodMonths = Math.round(dayjs(subscriptionContext.endAt).diff(dayjs(subscriptionContext.startAt), 'month', true))
    const paidEndAt = paidStartAt.add(periodMonths, 'month')
    return { paidStartAt, paidEndAt }
}

module.exports = {
    computePaidPeriod,
}
