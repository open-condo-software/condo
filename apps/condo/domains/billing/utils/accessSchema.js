const { get } = require('lodash')

const { getByCondition } = require('@core/keystone/schema')

async function checkBillingIntegrationAccessRight (userId, integrationId) {
    if (!userId || !integrationId) return false
    const integration = await getByCondition('BillingIntegrationAccessRight', {
        integration: { id: integrationId },
        user: { id: userId },
    })
    return !!get(integration, 'id')
}

module.exports = {
    checkBillingIntegrationAccessRight,
}
