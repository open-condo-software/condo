const {
    SUBSCRIPTION_INVOICE_REQUEST_WINDOW_IN_SEC,
    SUBSCRIPTION_INVOICE_REQUEST_MAX_CALLS_PER_WINDOW,
} = require('@condo/domains/subscription/constants')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const redisGuard = new RedisGuard()

/**
 * Throttles how often the same organization can send sales a notification about the same bundle of plans,
 * so a retried click or a flaky client can't spam it. `action` keeps RegisterSubscriptionContextsService's
 * budget separate from RequestSubscriptionInvoiceService's: registering a bundle and then immediately
 * asking to resend its invoice is a normal sequence and must not consume one shared counter.
 * Throws GQL_ERRORS.TOO_MANY_REQUESTS (via RedisGuard) once exceeded.
 */
async function checkSubscriptionInvoiceRequestLimit (context, action, organizationId, planIds) {
    const sortedPlanIds = [...new Set(planIds)].sort()

    await redisGuard.checkCustomLimitCounters(
        `subscription-invoice-request:${action}:${organizationId}:${sortedPlanIds.join(',')}`,
        SUBSCRIPTION_INVOICE_REQUEST_WINDOW_IN_SEC,
        SUBSCRIPTION_INVOICE_REQUEST_MAX_CALLS_PER_WINDOW,
        context,
    )
}

module.exports = {
    checkSubscriptionInvoiceRequestLimit,
}
