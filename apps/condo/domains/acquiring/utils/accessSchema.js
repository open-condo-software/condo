const get = require('lodash/get')

const { getByCondition } = require('@open-condo/keystone/schema')

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