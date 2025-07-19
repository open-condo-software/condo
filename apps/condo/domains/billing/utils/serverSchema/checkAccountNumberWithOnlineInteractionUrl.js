const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const { 
    ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS,
    ONLINE_INTERACTION_CHECK_ACCOUNT_ERROR_STATUS,
} = require('@condo/domains/billing/constants/onlineInteraction')

const logger = getLogger()

const getAccountsWithOnlineInteractionUrl = async (interactionUrl, tin, accountNumber) => {
    const url = new URL(interactionUrl)
    url.searchParams.append('tin', tin)
    url.searchParams.append('accountNumber', accountNumber)
    try {
        const response = await fetch(url.toString(), {
            maxRetries: 5,
            timeoutBetweenRequests: 1000,
        })
        if (response.ok) {
            return await response.json()
        }
    } catch (err) {
        logger.error({ err, data: { url: url.origin, tin, accountNumber } })
    }
    return { status: ONLINE_INTERACTION_CHECK_ACCOUNT_ERROR_STATUS }
}

const checkAccountNumberWithOnlineInteractionUrl = async (interactionUrl, tin, accountNumber) => {
    const { status } = await getAccountsWithOnlineInteractionUrl(interactionUrl, tin, accountNumber)
    return status === ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS
}

module.exports = {
    getAccountsWithOnlineInteractionUrl,
    checkAccountNumberWithOnlineInteractionUrl,
}