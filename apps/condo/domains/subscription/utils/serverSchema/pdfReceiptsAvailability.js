const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { getOrganizationsSubscriptionMap } = require('@condo/domains/subscription/utils/serverSchema/getOrganizationsSubscriptionMap')

const logger = getLogger()

const PDF_RECEIPTS_FEATURE = 'pdfReceipts'

/**
 * Billing integrations whose pdf receipts are available to residents only with "pdfReceipts" subscription feature.
 * Organizations connected to any other billing integration can use pdf receipts without subscription.
 * Env value is a JSON array of billing integration ids
 *
 * @returns {string[]}
 */
function getPdfReceiptsSubscriptionRequiredBillingIntegrationIds () {
    try {
        const integrationIds = JSON.parse(conf['PDF_RECEIPTS_SUBSCRIPTION_REQUIRED_BILLING_INTEGRATION_IDS'] || '[]')
        return Array.isArray(integrationIds) ? integrationIds : []
    } catch (err) {
        logger.error({ msg: 'invalid PDF_RECEIPTS_SUBSCRIPTION_REQUIRED_BILLING_INTEGRATION_IDS', err })
        return []
    }
}

function isPdfReceiptsSubscriptionRequired (integrationId) {
    return getPdfReceiptsSubscriptionRequiredBillingIntegrationIds().includes(integrationId)
}

/**
 * @param {string} organizationId
 * @returns {Promise<boolean>}
 */
async function canUsePdfReceiptsWithoutSubscription (organizationId) {
    const subscriptionRequiredIntegrationIds = getPdfReceiptsSubscriptionRequiredBillingIntegrationIds()
    if (subscriptionRequiredIntegrationIds.length === 0) return true

    const otherIntegrationContexts = await find('BillingIntegrationOrganizationContext', {
        organization: { id: organizationId },
        integration: { id_not_in: subscriptionRequiredIntegrationIds, deletedAt: null },
        deletedAt: null,
    })

    return otherIntegrationContexts.length > 0
}

/**
 * Returns ids of organizations whose residents can't see pdf receipts of billing integrations requiring subscription
 *
 * @param {object} context - keystone context
 * @param {Array<{ integrationId: string, organizationId: string }>} billingContexts
 * @returns {Promise<Set<string>>}
 */
async function getOrganizationIdsWithoutPdfReceipts (context, billingContexts) {
    const organizationIds = [...new Set(
        billingContexts
            .filter(({ integrationId }) => isPdfReceiptsSubscriptionRequired(integrationId))
            .map(({ organizationId }) => organizationId)
            .filter(Boolean)
    )]
    if (!organizationIds.length) return new Set()

    const subscriptionMap = await getOrganizationsSubscriptionMap(context, organizationIds, PDF_RECEIPTS_FEATURE)

    return new Set(organizationIds.filter(organizationId => !subscriptionMap.get(organizationId)))
}

module.exports = {
    isPdfReceiptsSubscriptionRequired,
    canUsePdfReceiptsWithoutSubscription,
    getOrganizationIdsWithoutPdfReceipts,
}
