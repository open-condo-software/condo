const { getByCondition } = require('@core/keystone/schema')
const get = require('lodash/get')

async function checkAcquiringIntegrationAccessRight (userId, integrationId) {
    if (!userId || !integrationId) return false
    const integration = await getByCondition('AcquiringIntegrationAccessRight', {
        integration: { id: integrationId },
        user: { id: userId },
    })
    return !!get(integration, 'id')
}

async function canReadSensitiveData ({ authentication: { item: user }, existingItem }) {
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true
    if (await checkAcquiringIntegrationAccessRight(user, existingItem.integration)) return true
    return false
}

module.exports = {
    checkAcquiringIntegrationAccessRight,
    canReadSensitiveData,
}