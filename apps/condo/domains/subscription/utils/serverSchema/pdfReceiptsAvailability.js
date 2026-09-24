const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { getOrganizationsSubscriptionMap } = require('@condo/domains/subscription/utils/serverSchema/getOrganizationsSubscriptionMap')

const logger = getLogger()

const PDF_RECEIPTS_FEATURE = 'pdfReceipts'

/**
 * Billing integrations whose pdf receipts are available to residents only with "pdfReceipts" subscription feature.
 * Organizations connected to any other billing integration can use pdf receipts without subscription.
 * Env value is a JSON array of billing integration ids.
 * A configured value that is not valid JSON or not an array is a misconfiguration and must fail loudly,
 * since silently falling back to an empty list would disable the paywall for everyone
 *
 * @returns {string[]}
 */
function getPdfReceiptsSubscriptionRequiredBillingIntegrationIds () {
    const rawValue = conf['PDF_RECEIPTS_SUBSCRIPTION_REQUIRED_BILLING_INTEGRATION_IDS']
    if (!rawValue) return []

    let integrationIds
    try {
        integrationIds = JSON.parse(rawValue)
    } catch (err) {
        logger.error({ msg: 'invalid PDF_RECEIPTS_SUBSCRIPTION_REQUIRED_BILLING_INTEGRATION_IDS', err })
        throw new Error('PDF_RECEIPTS_SUBSCRIPTION_REQUIRED_BILLING_INTEGRATION_IDS must be a JSON array of billing integration ids')
    }
    if (!Array.isArray(integrationIds)) {
        throw new Error('PDF_RECEIPTS_SUBSCRIPTION_REQUIRED_BILLING_INTEGRATION_IDS must be a JSON array of billing integration ids')
    }
    return integrationIds
}

function isPdfReceiptsSubscriptionRequired (integrationId) {
    return getPdfReceiptsSubscriptionRequiredBillingIntegrationIds().includes(integrationId)
}

/**
 * Organization is exempt only when it has at least one billing integration and none of them require the
 * "pdfReceipts" subscription feature. An organization with no billing integrations at all has nothing to be
 * exempt from, so it is not exempt (there is no matching receipt to gate either way).
 * A billing integration that doesn't require subscription must not exempt a subscription-required one
 * connected to the same organization
 *
 * @param {string} organizationId
 * @returns {Promise<boolean>}
 */
async function canUsePdfReceiptsWithoutSubscription (organizationId) {
    const subscriptionRequiredIntegrationIds = getPdfReceiptsSubscriptionRequiredBillingIntegrationIds()
    if (subscriptionRequiredIntegrationIds.length === 0) return true

    const integrationContexts = await find('BillingIntegrationOrganizationContext', {
        organization: { id: organizationId },
        deletedAt: null,
    })
    if (integrationContexts.length === 0) return false

    return integrationContexts.every(({ integration }) => !subscriptionRequiredIntegrationIds.includes(integration))
}

function buildPdfReceiptsRestrictionKey (organizationId, integrationId) {
    return `${organizationId}:${integrationId}`
}

/**
 * Returns keys of organization+integration pairs whose residents can't see pdf receipts, so an organization
 * connected to both a subscription-required and an unrestricted billing integration keeps files for the latter
 *
 * @param {object} context - keystone context
 * @param {Array<{ integrationId: string, organizationId: string }>} billingContexts
 * @returns {Promise<Set<string>>}
 */
async function getOrganizationIdsWithoutPdfReceipts (context, billingContexts) {
    const restrictedContexts = billingContexts.filter(({ integrationId }) => isPdfReceiptsSubscriptionRequired(integrationId))
    const organizationIds = [...new Set(restrictedContexts.map(({ organizationId }) => organizationId).filter(Boolean))]
    if (!organizationIds.length) return new Set()

    const subscriptionMap = await getOrganizationsSubscriptionMap(context, organizationIds, PDF_RECEIPTS_FEATURE)

    return new Set(
        restrictedContexts
            .filter(({ organizationId }) => organizationId && !subscriptionMap.get(organizationId))
            .map(({ organizationId, integrationId }) => buildPdfReceiptsRestrictionKey(organizationId, integrationId))
    )
}

module.exports = {
    isPdfReceiptsSubscriptionRequired,
    canUsePdfReceiptsWithoutSubscription,
    getOrganizationIdsWithoutPdfReceipts,
    buildPdfReceiptsRestrictionKey,
}
