const { get, uniq, isArray } = require('lodash')

const { find, getById } = require('@open-condo/keystone/schema')

const { checkPermissionsInUserOrganizationsOrRelatedOrganizations } = require('@condo/domains/organization/utils/accessSchema')

const { BankIntegrationAccessRight } = require('./serverSchema')


async function canManageBankEntityWithOrganization ({ authentication: { item: user }, originalInput, operation, itemId, itemIds, listKey }, permission) {
    const isBulkRequest = isArray(originalInput)

    let organizationIds

    if (operation === 'create') {
        if (isBulkRequest) {
            organizationIds = originalInput.map(el => get(el, ['data', 'organization', 'connect', 'id']))

            if (organizationIds.filter(Boolean).length !== originalInput.length) return false
            organizationIds = uniq(organizationIds)
        } else {
            const organizationId = get(originalInput, ['organization', 'connect', 'id'])
            organizationIds = [organizationId]
        }
    } else if (operation === 'update') {
        if (isBulkRequest) {
            if (!itemIds || !isArray(itemIds)) return false
            if (itemIds.length !== uniq(itemIds).length) return false

            const items = await find(listKey, {
                id_in: itemIds,
                deletedAt: null,
            })
            if (items.length !== itemIds.length) return false
            organizationIds = uniq(items.map(item => item.organization))
        } else {
            if (!itemId) return false
            const item = await getById(listKey, itemId)
            organizationIds = [item.organization]
        }
    }

    return await checkPermissionsInUserOrganizationsOrRelatedOrganizations(user.id, organizationIds, permission)
}

async function checkBankIntegrationsAccessRights (context, userId, integrationIds) {
    if (!context) return false
    if (!userId) return false
    if (!Array.isArray(integrationIds) || !integrationIds.length || !integrationIds.every(Boolean)) return false

    const rights = await BankIntegrationAccessRight.getAll(context, {
        integration: { id_in: integrationIds },
        user: { id: userId },
        deletedAt: null,
    }, { first: 100 })

    const permittedIntegrations = new Set(rights.map(right => right.integration.id))
    const nonPermittedIntegrations = integrationIds.filter(id => !permittedIntegrations.has(id))

    return nonPermittedIntegrations.length === 0
}

module.exports = {
    canManageBankEntityWithOrganization,
    checkBankIntegrationsAccessRights,
}
