const { getLogger } = require('@open-condo/keystone/logging')

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
                integration.name,
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
            msg: 'Failed to fetch card bindings',
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
                providers: [card.provider],
            })
            continue
        }

        if (!existing.providers.includes(card.provider)) {
            existing.providers.push(card.provider)
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