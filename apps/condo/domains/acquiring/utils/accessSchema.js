const isArray = require('lodash/isArray')
const isEmpty = require('lodash/isEmpty')

const { find } = require('@open-condo/keystone/schema')

async function checkAcquiringIntegrationAccessRights (userId, integrationIds) {
    if (!userId) return false
    if (!isArray(integrationIds) || isEmpty(integrationIds) || !integrationIds.every(Boolean)) return false

    const rights = await find('AcquiringIntegrationAccessRight', {
        integration: { id_in: integrationIds },
        user: { id: userId },
        deletedAt: null,
    })
    const permittedIntegrations = new Set(rights.map(right => right.integration))
    const nonPermittedIntegrations = integrationIds.filter(id => !permittedIntegrations.has(id))

    return isEmpty(nonPermittedIntegrations)
}

module.exports = {
    checkAcquiringIntegrationAccessRights,
}