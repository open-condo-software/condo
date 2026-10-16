const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger()

async function getUserCards (url, userId, acquiringIntegrationId) {
    try {
        const response = await fetch(url, {
            maxRetries: 5,
            timeoutBetweenRequests: 1000,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`)
        }

        const { cardTokens = [] } = await response.json()

        return cardTokens.map(card => ({
            ...card,
            acquiringIntegrationId,
        }))
    } catch (err) {
        logger.error({
            msg: 'failed to fetch card bindings',
            err,
            data: {
                acquiringIntegrationId,
                url,
                userId,
            },
        })

        return []
    }
}

async function deleteUserCard (url, userId, cardId, acquiringIntegrationId) {
    try {
        const response = await fetch(url, {
            maxRetries: 5,
            timeoutBetweenRequests: 1000,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                cardId,
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`)
        }

        return true
    } catch (err) {
        logger.error({
            msg: 'Failed to delete card binding',
            err,
            data: {
                acquiringIntegrationId,
                url,
                userId,
                cardId,
            },
        })

        return false
    }
}

module.exports = {
    getUserCards,
    deleteUserCard,
}