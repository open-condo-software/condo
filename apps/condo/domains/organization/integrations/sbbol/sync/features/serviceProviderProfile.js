const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')

const { AcquiringIntegrationContext: AcquiringContext } = require('@condo/domains/acquiring/utils/serverSchema')
const { BillingIntegrationOrganizationContext: BillingContext } = require('@condo/domains/billing/utils/serverSchema')
const { CONTEXT_FINISHED_STATUS, CONTEXT_IN_PROGRESS_STATUS } = require('@condo/domains/miniapp/constants')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')

const { getSPPConfig } = require('./config')

const CTX_INIT_STATE = {
    settings: { dv: 1 },
    state: { dv: 1 },
}

const logger = getLogger('sbbol-sync-features-spp')

/**
 * Connects billing and acquiring miniapps for SPP clients
 * @param context keystone context acquired from main sync task containing adminContext for server-side utils
 * @param organization created / updated organization
 * @returns {Promise<boolean>} Is all condition for connecting was met
 */
async function syncServiceProviderProfileState ({ context, organization }) {
    const { context: adminContext } = context
    const config = getSPPConfig()
    const orgId = organization.id

    if (!('BillingIntegrationId' in config && 'AcquiringIntegrationId' in config)) {
        logger.warn({
            msg: 'Non-valid .env config, skipping SPP integration',
            entityId: orgId,
            entity: 'Organization',
        })
        return false
    }

    const billingId = config.BillingIntegrationId
    const acquiringId = config.AcquiringIntegrationId

    const billingContexts = await BillingContext.getAll(adminContext, {
        organization: { id: orgId },
        deletedAt: null,
    }, 'id status integration { id }')
    const activeBillingContext = billingContexts.find(ctx => ctx.status === CONTEXT_FINISHED_STATUS)
    const existingBillingContext = billingContexts.find(ctx => get(ctx, ['integration', 'id']) === billingId)
    const activeBillingIntegrationId = get(activeBillingContext, ['integration', 'id'])
    const canConnectBilling = !(activeBillingContext && activeBillingIntegrationId !== billingId)

    const acquiringContexts = await AcquiringContext.getAll(adminContext, {
        organization: { id: orgId },
        deletedAt: null,
    }, 'id status integration { id }')
    const activeAcquiringContext = acquiringContexts.find(ctx => ctx.status === CONTEXT_FINISHED_STATUS)
    const existingAcquiringContext = acquiringContexts.find(ctx => get(ctx, ['integration', 'id']) === acquiringId)
    const activeAcquiringIntegrationId = get(activeAcquiringContext, ['integration', 'id'])
    const canConnectAcquiring = !(activeAcquiringContext && activeAcquiringIntegrationId !== acquiringId)

    if (!canConnectBilling || !canConnectAcquiring) {
        if (!canConnectBilling) {
            logger.error({
                msg: 'SPP cannot be connected because another billing integration is already connected',
                entityId: orgId,
                entity: 'Organization',
                data: {
                    activeBillingIntegrationId,
                },
            })
        }

        if (!canConnectAcquiring) {
            logger.error({
                msg: 'SPP cannot be connected because another acquiring integration is already connected',
                entityId: orgId,
                entity: 'Organization',
                data: {
                    activeAcquiringIntegrationId,
                },
            })
        }

        if (!existingBillingContext) {
            logger.info({
                msg: `not found existing context for specified billing integration. Creating new one with "${CONTEXT_IN_PROGRESS_STATUS}" status to notify sales CRM`,
                entityId: orgId,
                entity: 'Organization',
            })
            await BillingContext.create(adminContext, {
                ...dvSenderFields,
                ...CTX_INIT_STATE,
                organization: { connect: { id: orgId } },
                integration: { connect: { id: billingId } },
                status: CONTEXT_IN_PROGRESS_STATUS,
            })
        }

        if (!existingAcquiringContext) {
            logger.info({
                msg: `not found existing context for specified acquiring integration. Creating new one with "${CONTEXT_IN_PROGRESS_STATUS}" status to notify sales CRM`,
                entityId: orgId,
                entity: 'Organization',
            })

            await AcquiringContext.create(adminContext, {
                ...dvSenderFields,
                ...CTX_INIT_STATE,
                organization: { connect: { id: orgId } },
                integration: { connect: { id: acquiringId } },
                status: CONTEXT_IN_PROGRESS_STATUS,
            })
        }

        return false
    }

    if (existingBillingContext) {
        if (existingBillingContext.status !== CONTEXT_FINISHED_STATUS) {
            logger.info({
                msg: `updating existing billing integration context to "${CONTEXT_FINISHED_STATUS}" status`,
                entityId: orgId,
                entity: 'Organization',
            })
            await BillingContext.update(adminContext, existingBillingContext.id, {
                ...dvSenderFields,
                status: CONTEXT_FINISHED_STATUS,
            })
        } else {
            logger.info({
                msg: 'billing integration is already connected for organization, moving on to acquiring',
                entityId: orgId,
                entity: 'Organization',
            })
        }
    } else {
        logger.info({
            msg: `creating new billing integration context with "${CONTEXT_FINISHED_STATUS}" status`,
            entityId: orgId,
            entity: 'Organization',
        })
        await BillingContext.create(adminContext, {
            ...dvSenderFields,
            ...CTX_INIT_STATE,
            organization: { connect: { id: orgId } },
            integration: { connect: { id: billingId } },
            status: CONTEXT_FINISHED_STATUS,
        })
    }

    if (existingAcquiringContext) {
        if (existingAcquiringContext.status !== CONTEXT_FINISHED_STATUS) {
            logger.info({
                msg: `updating existing acquiring integration context to "${CONTEXT_FINISHED_STATUS}" status`,
                entityId: orgId,
                entity: 'Organization',
            })
            await AcquiringContext.update(adminContext, existingAcquiringContext.id, {
                ...dvSenderFields,
                status: CONTEXT_FINISHED_STATUS,
            })
        } else {
            logger.info({
                msg: 'acquiring integration is already connected for organization',
                entityId: orgId,
                entity: 'Organization',
            })
        }
    } else {
        logger.info({
            msg: `creating new acquiring integration context with "${CONTEXT_FINISHED_STATUS}" status`,
            entityId: orgId,
            entity: 'Organization',
        })
        await AcquiringContext.create(adminContext, {
            ...dvSenderFields,
            ...CTX_INIT_STATE,
            organization: { connect: { id: orgId } },
            integration: { connect: { id: acquiringId } },
            status: CONTEXT_FINISHED_STATUS,
        })
    }

    return true
}

module.exports = {
    syncServiceProviderProfileState,
}