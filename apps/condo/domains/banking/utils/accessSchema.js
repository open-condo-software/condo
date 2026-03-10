const get = require('lodash/get')
const isArray = require('lodash/isArray')
const uniq = require('lodash/uniq')

const { find } = require('@open-condo/keystone/schema')

const {
    checkPermissionsInEmployedOrRelatedOrganizations,
} = require('@condo/domains/organization/utils/accessSchema')

const { BankIntegrationAccessRight } = require('./serverSchema')


async function canManageBankEntityWithOrganization ({ authentication: { item: user }, context, originalInput, operation, itemId, itemIds, listKey }, permission) {
    const isBulkRequest = isArray(originalInput)

    let organizationIds

    if (operation === 'create') {
        if (isBulkRequest) {
            organizationIds = originalInput.map(el => get(el, ['data', 'organization', 'connect', 'id']))

            if (organizationIds.filter(Boolean).length !== originalInput.length) return false
            organizationIds = uniq(organizationIds)
        } else {
            const organizationId = get(originalInput, ['organization', 'connect', 'id'])
            if (!organizationId) return false
            organizationIds = [organizationId]
        }
    } else if (operation === 'update') {
        const ids = itemIds || [itemId]
        if (ids.length !== uniq(ids).length) return false

        const items = await find(listKey, {
            id_in: ids,
            deletedAt: null,
        })
        if (items.length !== ids.length || items.some(item => !item.organization)) return false
        organizationIds = uniq(items.map(item => item.organization))
    }

    return await checkPermissionsInEmployedOrRelatedOrganizations(context, user, organizationIds, permission)
}

async function checkBankIntegrationsAccessRights (context, userId, integrationIds) {
    if (!context) return false
    if (!userId) return false
    if (!Array.isArray(integrationIds) || !integrationIds.length || !integrationIds.every(Boolean)) return false

    const rights = await BankIntegrationAccessRight.getAll(context, {
        integration: { id_in: integrationIds },
        user: { id: userId },
        deletedAt: null,
    }, 'id integration { id }', { first: 100 })

    const permittedIntegrations = new Set(rights.map(right => right.integration.id))
    const nonPermittedIntegrations = integrationIds.filter(id => !permittedIntegrations.has(id))

    return nonPermittedIntegrations.length === 0
}

module.exports = {
    canManageBankEntityWithOrganization,
    checkBankIntegrationsAccessRights,
}
