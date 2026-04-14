const { GQLError } = require('@open-condo/keystone/errors')
const { getByCondition, find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { ACQUIRING_INTEGRATION_EXTERNAL_IMPORT_TYPE } = require('@condo/domains/acquiring/constants/integration')
const { REGISTER_EXTERNAL_PAYMENTS_ERRORS: ERRORS } = require('@condo/domains/acquiring/constants/registerExternalPaymentsErrors')

async function loadAcquiringContext (id, context) {
    const acquiringContext = await getByCondition('AcquiringIntegrationContext', {
        id,
        status: CONTEXT_FINISHED_STATUS,
        deletedAt: null,
    })

    if (!acquiringContext) {
        throw new GQLError(ERRORS.ACQUIRING_CONTEXT_NOT_FOUND, context)
    }

    return acquiringContext
}

async function loadAcquiringIntegration (id, context) {
    const acquiringIntegration = await getByCondition('AcquiringIntegration', {
        id,
        type: ACQUIRING_INTEGRATION_EXTERNAL_IMPORT_TYPE,
        deletedAt: null,
    })
    
    if (!acquiringIntegration) {
        throw new GQLError(ERRORS.ACQUIRING_INTEGRATION_NOT_FOUND, context)
    }

    return acquiringIntegration
}

async function loadExistingMultiPayments (acquiringIntegrationId, acquiringContextId, transactionIds ) {
    return await find('MultiPayment', {
        integration: { id: acquiringIntegrationId },
        transactionId_in: transactionIds,
        payments_some: { context: { id: acquiringContextId } },
        deletedAt: null,
    })
}

module.exports = {
    loadAcquiringContext,
    loadAcquiringIntegration,
    loadExistingMultiPayments,
}