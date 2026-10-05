const { SUBSCRIPTION_FEATURE_AVAILABILITY } = require('@condo/domains/subscription/constants')
const { getPdfReceiptsAvailability } = require('@condo/domains/subscription/utils/serverSchema/pdfReceiptsAvailability')

/**
 * The one place that decides how plan features are offered to the organization. Only features with their
 * own rules are listed, every other one follows the plans
 *
 * @param {{ id: string, features?: string[] }} organization
 * @returns {Promise<Record<string, string>>} feature key to one of SUBSCRIPTION_FEATURE_AVAILABILITY
 */
async function getFeatureAvailability (organization) {
    return {
        pdfReceipts: await getPdfReceiptsAvailability(organization),
    }
}

/** A free or hidden feature works without any plan, the organization's subscription reports it as never ending */
function isAvailableWithoutSubscription (availability) {
    return availability === SUBSCRIPTION_FEATURE_AVAILABILITY.FREE || availability === SUBSCRIPTION_FEATURE_AVAILABILITY.HIDDEN
}

module.exports = {
    getFeatureAvailability,
    isAvailableWithoutSubscription,
}
