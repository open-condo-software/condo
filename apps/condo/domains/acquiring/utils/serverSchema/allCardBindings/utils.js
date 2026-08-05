const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE } = require('@condo/domains/acquiring/constants/integration')
const { getUserCards } = require('@condo/domains/acquiring/utils/serverSchema/cardsOnlineInteraction')

const logger = getLogger()

async function fetchCardTokens (userId) {
    const acquiringIntegrations = await find('AcquiringIntegration', {
        type: ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE,
        getUserCardsUrl_not: null,
        deleteUserCardUrl_not: null,
        deletedAt: null,
    })

    const results = await Promise.allSettled(
        acquiringIntegrations.map(integration =>
            getUserCards(
                integration.getUserCardsUrl,
                userId,
                integration.id,
            )
        )
    )

    const cardTokens = []

    for (const result of results) {
        if (result.status === 'fulfilled') {
            cardTokens.push(...result.value)
            continue
        }

        logger.error({
            msg: 'failed to fetch card bindings',
            err: result.reason,
        })
    }

    return cardTokens
}

function deduplicateCardTokens (cardTokens) {
    const deduplicated = new Map()

    for (const card of cardTokens) {
        const existing = deduplicated.get(card.id)

        if (!existing) {
            deduplicated.set(card.id, {
                ...card,
                acquiringIntegrationIds: [card.acquiringIntegrationId],
            })
            continue
        }

        if (!existing.acquiringIntegrationIds.includes(card.acquiringIntegrationId)) {
            existing.acquiringIntegrationIds.push(card.acquiringIntegrationId)
        }

        existing.bankName ||= card.bankName
        existing.bankCountryCode ||= card.bankCountryCode
    }

    return [...deduplicated.values()]
}

module.exports = {
    fetchCardTokens,
    deduplicateCardTokens,
}