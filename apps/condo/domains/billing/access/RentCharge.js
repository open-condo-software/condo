const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById } = require('@open-condo/keystone/schema')

const {
    checkPermissionsInEmployedOrRelatedOrganizations,
    getEmployedOrRelatedOrganizationsByPermissions,
} = require('@condo/domains/organization/utils/accessSchema')
const { RESIDENT, SERVICE } = require('@condo/domains/user/constants/common')
const { canDirectlyManageSchemaObjects, canDirectlyReadSchemaObjects } = require('@condo/domains/user/utils/directAccess')

async function canReadRentCharges ({ authentication: { item: user }, context, listKey }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return {}

    const hasDirectAccess = await canDirectlyReadSchemaObjects(user, listKey)
    if (hasDirectAccess) return true

    if (user.type === RESIDENT) {
        return {
            occupancy: {
                tenant: { user: { id: user.id } },
                deletedAt: null,
            },
            deletedAt: null,
        }
    }

    if (user.type === SERVICE) return false

    const organizationIds = await getEmployedOrRelatedOrganizationsByPermissions(context, user, 'canReadBillingReceipts')

    return {
        organization: {
            id_in: organizationIds,
        },
        deletedAt: null,
    }
}

async function canManageRentCharges ({ authentication: { item: user }, originalInput, operation, itemId, context, listKey }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    const hasDirectAccess = await canDirectlyManageSchemaObjects(user, listKey, originalInput, operation)
    if (hasDirectAccess) return true
    if (user.type === RESIDENT || user.type === SERVICE) return false

    let organizationId = get(originalInput, ['organization', 'connect', 'id'])

    if (!organizationId && operation === 'create') {
        const occupancyId = get(originalInput, ['occupancy', 'connect', 'id'])
        const occupancy = occupancyId && await getById('Occupancy', occupancyId)
        organizationId = get(occupancy, 'organization')
    } else if (operation === 'update' && itemId) {
        const item = await getById('RentCharge', itemId)
        organizationId = get(item, 'organization')
    }

    if (!organizationId) return false

    return await checkPermissionsInEmployedOrRelatedOrganizations(context, user, organizationId, 'canManageBillingReceipts')
}

module.exports = {
    canReadRentCharges,
    canManageRentCharges,
}
