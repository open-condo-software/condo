const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, find, itemsQuery } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS, CONTEXT_ERROR_STATUS, CONTEXT_ERROR_REASON_NO_SUBSCRIPTION } = require('@condo/domains/miniapp/constants')
const { B2BAppContext } = require('@condo/domains/miniapp/utils/serverSchema')
const { Organization } = require('@condo/domains/organization/utils/serverSchema')

const logger = getLogger('suspendB2BAppContextsWithoutSubscription')

const SENDER = { dv: 1, fingerprint: 'suspendB2BAppContextsWithoutSubscription' }
const CHUNK_SIZE = 100

function getOrganizationTypesByAppId (plans) {
    const organizationTypesByAppId = new Map()
    for (const plan of plans) {
        for (const appId of plan.enabledB2BApps || []) {
            const organizationTypes = organizationTypesByAppId.get(appId) || new Set()
            organizationTypes.add(plan.organizationType)
            organizationTypesByAppId.set(appId, organizationTypes)
        }
    }
    return organizationTypesByAppId
}

/**
 * Same logic as isB2BAppEnabled on frontend: app included into plans for organization type
 * is available only with active subscription. Subscription field returns far-future endAt when subscriptions are disabled
 */
function isAppSubscriptionExpired (organization, appId, now) {
    const subscriptionApp = (organization.subscription?.b2bApps || []).find(app => app.id === appId)
    if (!subscriptionApp || !subscriptionApp.endAt) return true

    return !dayjs(subscriptionApp.endAt).isAfter(now)
}

async function suspendB2BAppContext (context, b2bAppContext) {
    try {
        await B2BAppContext.update(context, b2bAppContext.id, {
            dv: 1,
            sender: SENDER,
            status: CONTEXT_ERROR_STATUS,
            errorReason: CONTEXT_ERROR_REASON_NO_SUBSCRIPTION,
        })
        logger.info({
            msg: 'suspended B2BAppContext without subscription',
            entity: 'B2BAppContext',
            entityId: b2bAppContext.id,
            data: { organizationId: b2bAppContext.organization, appId: b2bAppContext.app },
        })
        return true
    } catch (err) {
        logger.error({ msg: 'failed to suspend B2BAppContext', err, entity: 'B2BAppContext', entityId: b2bAppContext.id })
        return false
    }
}

async function suspendAppContexts (context, appId, organizationTypes, now) {
    let skip = 0
    let suspendedCount = 0
    let hasMoreData = true

    while (hasMoreData) {
        const b2bAppContexts = await itemsQuery('B2BAppContext', {
            where: {
                app: { id: appId, deletedAt: null },
                organization: { type_in: organizationTypes, deletedAt: null },
                status: CONTEXT_FINISHED_STATUS,
                deletedAt: null,
            },
            sortBy: ['createdAt_ASC', 'id_ASC'],
            first: CHUNK_SIZE,
            skip,
        })
        hasMoreData = b2bAppContexts.length === CHUNK_SIZE
        if (b2bAppContexts.length === 0) break

        const organizations = await Organization.getAll(
            context,
            { id_in: b2bAppContexts.map(b2bAppContext => b2bAppContext.organization), deletedAt: null },
            'id subscription { b2bApps { id endAt } }',
        )
        const organizationById = new Map(organizations.map(organization => [organization.id, organization]))

        let suspendedInChunkCount = 0
        for (const b2bAppContext of b2bAppContexts) {
            const organization = organizationById.get(b2bAppContext.organization)
            if (!organization || !isAppSubscriptionExpired(organization, appId, now)) continue

            if (await suspendB2BAppContext(context, b2bAppContext)) {
                suspendedInChunkCount++
            }
        }

        // Suspended contexts are not Finished anymore and leave the selection, so skip only the remaining ones
        skip += b2bAppContexts.length - suspendedInChunkCount
        suspendedCount += suspendedInChunkCount
    }

    return suspendedCount
}

/**
 * Moves finished B2BAppContexts to Error status when organization has no active subscription for the app.
 * So miniapp loses access to organization data without knowing anything about subscriptions.
 * Contexts are moved back to Finished when subscription with the app becomes active (see SubscriptionContext afterChange)
 */
async function suspendB2BAppContextsWithoutSubscription () {
    const { keystone } = getSchemaCtx('B2BAppContext')
    const context = await keystone.createContext({ skipAccessControl: true })
    const now = dayjs()

    const plans = await find('SubscriptionPlan', { isHidden: false, deletedAt: null })
    const organizationTypesByAppId = getOrganizationTypesByAppId(plans)

    for (const [appId, organizationTypes] of organizationTypesByAppId) {
        const suspendedCount = await suspendAppContexts(context, appId, [...organizationTypes], now)
        logger.info({ msg: 'suspended B2BAppContexts without subscription', count: suspendedCount, data: { appId } })
    }
}

module.exports = {
    suspendB2BAppContextsWithoutSubscription,
}
