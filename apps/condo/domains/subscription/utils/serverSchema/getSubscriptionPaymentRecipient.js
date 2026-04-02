const conf = require('@open-condo/config')
const { find } = require('@open-condo/keystone/schema')

/**
 * Gets subscription payment recipient organization ID and acquiring integration.
 * 
 * Reads SUBSCRIPTION_PAYMENT_RECIPIENT from config and finds acquiring integration.
 * Throws error if SUBSCRIPTION_PAYMENT_RECIPIENT is not configured.
 * 
 * @returns {Promise<{recipientOrgId: string, acquiringIntegration: object}>}
 */
async function getSubscriptionPaymentRecipient () {
    const recipientOrgId = conf['SUBSCRIPTION_PAYMENT_RECIPIENT']
    
    if (!recipientOrgId) {
        throw new Error('SUBSCRIPTION_PAYMENT_RECIPIENT environment variable is not set.')
    }
    
    const acquiringIntegrationContexts = await find('AcquiringIntegrationContext', {
        organization: { id: recipientOrgId },
        deletedAt: null,
    })

    let acquiringIntegration = null
    if (acquiringIntegrationContexts.length > 0) {
        const integrationId = acquiringIntegrationContexts[0].integration
        const acquiringIntegrations = await find('AcquiringIntegration', {
            id: integrationId,
            deletedAt: null,
        })
        acquiringIntegration = acquiringIntegrations[0] || null
    }

    return { recipientOrgId, acquiringIntegration }
}

module.exports = {
    getSubscriptionPaymentRecipient,
}
