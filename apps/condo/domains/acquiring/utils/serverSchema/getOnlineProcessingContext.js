const { find } = require('@open-condo/keystone/schema')

const { ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE } = require('@condo/domains/acquiring/constants/integration')

async function getOnlineProcessingContext (context, organizationIds) {
    const acquiringIntegrationContexts = await find('AcquiringIntegrationContext', {
        organization: { id_in: organizationIds },
        deletedAt: null,
        status: CONTEXT_FINISHED_STATUS,
        integration: { type: ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE, deletedAt: null },
    })
}

module.exports = {
    getOnlineProcessingContext,
}