const conf = require('@open-condo/config')

/**
 * Builds the direct payment URL for card payments by appending organization and
 * provider query params. Returns null when there is no base url. Used both by
 * registerSubscriptionContexts and by the recurrent payments cron, which retries
 * a card charge on an existing invoice.
 */
function buildDirectPaymentUrl (directPaymentUrl, organizationId) {
    if (!directPaymentUrl) return null
    const provider = conf['B2B_PAYMENTS_PROVIDER']
    const url = new URL(directPaymentUrl)
    url.searchParams.append('organizationId', organizationId)
    url.searchParams.append('provider', provider)
    return url.toString()
}

module.exports = {
    buildDirectPaymentUrl,
}
