const conf = require('@open-condo/config')
const { find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { SERVICE_PROVIDER_PROFILE_FEATURE } = require('@condo/domains/organization/constants/features')
const { SUBSCRIPTION_FEATURE_AVAILABILITY } = require('@condo/domains/subscription/constants')
const { getOrganizationsSubscriptionMap } = require('@condo/domains/subscription/utils/serverSchema/getOrganizationsSubscriptionMap')

const PDF_RECEIPTS_FEATURE = 'pdfReceipts'

/**
 * Pdf receipts of the registry exchange integration are available to residents only with "pdfReceipts" subscription
 * feature. Organizations connected to any other billing integration can use pdf receipts without subscription.
 *
 * @returns {string|null}
 */
function getRegistryUploadIntegrationId () {
    return conf['REGISTRY_UPLOAD_INTEGRATION_ID'] || null
}

function isPdfReceiptsSubscriptionRequired (integrationId) {
    const registryUploadIntegrationId = getRegistryUploadIntegrationId()
    return Boolean(registryUploadIntegrationId) && integrationId === registryUploadIntegrationId
}

/**
 * SPP organizations get pdf receipts as part of their own registry upload, so the feature is not offered to them.
 * The registry exchange sells pdf receipts by plan, and it does so even when the organization also has another
 * billing integration. Any other billing gets them for free. Without a billing there is nothing to attach receipts
 * to, so they are not sold until one is set up. A billing counts only once its connection is finished
 *
 * @param {{ id: string, features?: string[] }} organization
 * @returns {Promise<string>} one of SUBSCRIPTION_FEATURE_AVAILABILITY
 */
async function getPdfReceiptsAvailability (organization) {
    if (organization.features?.includes(SERVICE_PROVIDER_PROFILE_FEATURE)) return SUBSCRIPTION_FEATURE_AVAILABILITY.HIDDEN

    const registryUploadIntegrationId = getRegistryUploadIntegrationId()
    if (!registryUploadIntegrationId) return SUBSCRIPTION_FEATURE_AVAILABILITY.FREE

    const integrationContexts = await find('BillingIntegrationOrganizationContext', {
        organization: { id: organization.id },
        status: CONTEXT_FINISHED_STATUS,
        deletedAt: null,
    })
    if (integrationContexts.length === 0) return SUBSCRIPTION_FEATURE_AVAILABILITY.REQUIRES_SETUP
    if (integrationContexts.some(({ integration }) => integration === registryUploadIntegrationId)) {
        return SUBSCRIPTION_FEATURE_AVAILABILITY.BY_PLAN
    }

    return SUBSCRIPTION_FEATURE_AVAILABILITY.FREE
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
    getPdfReceiptsAvailability,
    getOrganizationIdsWithoutPdfReceipts,
    buildPdfReceiptsRestrictionKey,
}
