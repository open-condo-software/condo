const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE } = require('@condo/domains/acquiring/constants/integration')
const { deleteUserCard } = require('@condo/domains/acquiring/utils/serverSchema/cardsOnlineInteraction')

const logger = getLogger()

async function deleteCardBinding (userId, cardId) {
    const acquiringIntegrations = await find('AcquiringIntegration', {
        type: ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE,
        getUserCardsUrl_not: null,
        deleteUserCardUrl_not: null,
        deletedAt: null,
    })

    const results = await Promise.allSettled(
        acquiringIntegrations.map(integration =>
            deleteUserCard(
                integration.deleteUserCardUrl,
                userId,
                cardId,
                integration.id,
            )
        )
    )

    const failedResults = results.filter((result) => result.status === 'rejected' || result.value !== true)

    if (failedResults.length > 0) {
        const error = new Error(`Failed to delete card binding from ${failedResults.length} acquiring integration(s)`)
        logger.error({
            msg: 'failed to delete card binding',
            err: error,
            data: { failedCount: failedResults.length, acquiringIntegrationCount: acquiringIntegrations.length },
        })
        throw error
    }
}

module.exports = {
    deleteCardBinding,
}
