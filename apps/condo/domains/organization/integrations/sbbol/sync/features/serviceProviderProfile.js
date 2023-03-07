
const { AcquiringIntegrationContext: AcquiringContext } = require('@condo/domains/acquiring/utils/serverSchema')
const { BillingIntegrationOrganizationContext: BillingContext } = require('@condo/domains/billing/utils/serverSchema')
const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')

const { getSPPConfig } = require('./config')

/**
 * Connects billing and acquiring miniapps for SPP clients
 * @param context keystone context acquired from main sync task containing adminContext for server-side utils
 * @param organization created / updated organization
 * @returns {Promise<void>}
 */
async function syncServiceProviderProfileState ({ context, organization }) {
    const { context: adminContext } = context
    const config = getSPPConfig()
    if (!('BillingIntegrationId' in config && 'AcquiringIntegrationId' in config)) {
        return
    }

    const billingId = config.BillingIntegrationId
    const acquiringId = config.AcquiringIntegrationId

    const [existingBillingContext] = await BillingContext.getAll(adminContext, {
        integration: { id: billingId },
        organization: { id: organization.id },
        deletedAt: null,
    }, { first: 1 })

    if (existingBillingContext && existingBillingContext.status !== CONTEXT_FINISHED_STATUS) {
        await BillingContext.update(adminContext, existingBillingContext.id, {
            ...dvSenderFields,
            status: CONTEXT_FINISHED_STATUS,
        })
    } else if (!existingBillingContext) {
        await BillingContext.create(adminContext, {
            ...dvSenderFields,
            settings: { dv: 1 },
            state: { dv: 1 },
            organization: { connect: { id: organization.id } },
            integration: { connect: { id: billingId } },
            status: CONTEXT_FINISHED_STATUS,
        })
    }

    const [existingAcquiringContext] = await AcquiringContext.getAll(adminContext, {
        integration: { id: acquiringId },
        organization: { id: organization.id },
        deletedAt: null,
    }, { first: 1 })
    if (existingAcquiringContext && existingAcquiringContext.status !== CONTEXT_FINISHED_STATUS) {
        await AcquiringContext.update(adminContext, existingAcquiringContext.id, {
            ...dvSenderFields,
            status: CONTEXT_FINISHED_STATUS,
        })
    } else if (!existingAcquiringContext) {
        await AcquiringContext.create(adminContext, {
            ...dvSenderFields,
            settings: { dv: 1 },
            state: { dv: 1 },
            organization: { connect: { id: organization.id } },
            integration: { connect: { id: acquiringId } },
            status: CONTEXT_FINISHED_STATUS,
        })
    }
}

module.exports = {
    syncServiceProviderProfileState,
}