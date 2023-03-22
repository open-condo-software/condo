const { get, uniq, isArray } = require('lodash')

const { find, getById } = require('@open-condo/keystone/schema')

const { checkPermissionsInUserOrganizationsOrRelatedOrganizations } = require('@condo/domains/organization/utils/accessSchema')

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

module.exports = {
    canManageBankEntityWithOrganization,
}
