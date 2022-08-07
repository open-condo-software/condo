const { getByCondition } = require('@condo/keystone/schema')
const get = require('lodash/get')

async function checkAcquiringIntegrationAccessRight (userId, integrationId) {
    if (!userId || !integrationId) return false
    const integration = await getByCondition('AcquiringIntegrationAccessRight', {
        integration: { id: integrationId },
        user: { id: userId },
        deletedAt: null,
    })
    return !!get(integration, 'id')
}

module.exports = {
    checkAcquiringIntegrationAccessRight,
}