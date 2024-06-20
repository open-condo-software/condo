const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const { 
    ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS,
} = require('@condo/domains/billing/constants/onlineInteraction')

const logger = getLogger('condo')

const checkAccountNumberWithOnlineInteractionUrl = async (interactionUrl, tin, accountNumber) => {
    const url = new URL(interactionUrl)
    url.searchParams.append('tin', tin)
    url.searchParams.append('accountNumber', accountNumber)
    try {
        const response = await fetch(url.toString(), {
            maxRetries: 5,
            timeoutBetweenRequests: 1000,
        })
        if (response.ok) {
            const { status } = await response.json()
            if (status === ONLINE_INTERACTION_CHECK_ACCOUNT_SUCCESS_STATUS) {
                return true
            }
            logger.info({ msg: 'Billing account not found', payload: { url: url.origin, tin, accountNumber, status } })
        }
    } catch (error) {
        logger.error({ err: error, payload: { url: url.origin, tin, accountNumber } })
    }
    return false
}

module.exports = {
    checkAccountNumberWithOnlineInteractionUrl,
}