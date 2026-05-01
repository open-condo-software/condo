const get = require('lodash/get')
const uniq = require('lodash/uniq')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find, getById } = require('@open-condo/keystone/schema')

const {
    checkPermissionsInEmployedOrganizations,
    getEmployedOrRelatedOrganizationsByPermissions,
} = require('@condo/domains/organization/utils/accessSchema')
const { getUserResidents } = require('@condo/domains/resident/utils/accessSchema')
const { RESIDENT, SERVICE } = require('@condo/domains/user/constants/common')
const { canDirectlyManageSchemaObjects, canDirectlyReadSchemaObjects } = require('@condo/domains/user/utils/directAccess')

async function canReadRentalUnits ({ authentication: { item: user }, context, listKey }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) return {}

    const hasDirectAccess = await canDirectlyReadSchemaObjects(user, listKey)
    if (hasDirectAccess) return true

    if (user.type === RESIDENT) {
        const residents = await getUserResidents(context, user)
        const propertyIds = uniq(residents.map(resident => resident.property).filter(Boolean))

        return {
            property: {
                id_in: propertyIds,
            },
            deletedAt: null,
        }
    }

    if (user.type === SERVICE) return false

    const organizationIds = await getEmployedOrRelatedOrganizationsByPermissions(context, user, 'canReadProperties')

    return {
        organization: {
            id_in: organizationIds,
        },
        deletedAt: null,
    }
}

async function canManageRentalUnits ({ authentication: { item: user }, originalInput, operation, itemId, itemIds, context, listKey }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    const hasDirectAccess = await canDirectlyManageSchemaObjects(user, listKey, originalInput, operation)
    if (hasDirectAccess) return true
    if (user.type === RESIDENT || user.type === SERVICE) return false

    const isBulkRequest = Array.isArray(originalInput)
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

        const items = await find('RentalUnit', {
            id_in: ids,
            deletedAt: null,
        })

        if (items.length !== ids.length || items.some(item => !item.organization)) return false
        organizationIds = uniq(items.map(item => item.organization))
    } else if (operation === 'delete' && itemId) {
        const item = await getById('RentalUnit', itemId)
        if (!item || !item.organization) return false
        organizationIds = [item.organization]
    }

    return await checkPermissionsInEmployedOrganizations(context, user, organizationIds, 'canManageProperties')
}

module.exports = {
    canReadRentalUnits,
    canManageRentalUnits,
}
