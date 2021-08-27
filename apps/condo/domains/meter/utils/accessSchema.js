const { checkRelatedOrganizationPermission } = require('../../organization/utils/accessSchema')
const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const get = require('lodash/get')
const { checkPermissionInUserOrganizationOrRelatedOrganization } = require('../../organization/utils/accessSchema')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { queryOrganizationEmployeeFromRelatedOrganizationFor } = require('@condo/domains/organization/utils/accessSchema')
const { queryOrganizationEmployeeFor } = require('@condo/domains/organization/utils/accessSchema')

async function canReadMeterEntity ({ user }) {
    if (user.isAdmin) return {}
    if (user.type === RESIDENT) {
        return {
            createdBy: { id: user.id },
        }
    }
    const userId = user.id
    return {
        organization: {
            OR: [
                queryOrganizationEmployeeFor(userId),
                queryOrganizationEmployeeFromRelatedOrganizationFor(userId),
            ],
        },
    }
}

async function canManageMeterEntity ({ schema, user, itemId, operation, originalInput, context }) {
    if (user.isAdmin) return true
    if (operation === 'create') {
        const organizationIdFromMeterEntity = get(originalInput, ['organization', 'connect', 'id'])
        if (!organizationIdFromMeterEntity) {
            return false
        }

        const propertyId = get(originalInput, ['property', 'connect', 'id'])
        const [property] = await Property.getAll(context, { id: propertyId })
        if (!property) {
            return false
        }

        if (user.type === RESIDENT) {
            return true
        }

        const organizationIdFromProperty = get(property, ['organization', 'id'])
        if (organizationIdFromMeterEntity !== organizationIdFromProperty)
            return false

        return await checkPermissionInUserOrganizationOrRelatedOrganization(context, user.id, organizationIdFromMeterEntity, 'canManageMeters')

    } else if (operation === 'update') {
        if (!itemId) {
            return false
        }

        const [meterEntity] = await schema.getAll(context, { id: itemId })
        if (!meterEntity)
            return false

        // if we pass property then we need check that this Property is in the organization in which the Meter is located
        const organizationIdFromMeterEntity = get(meterEntity, ['organization', 'id'])
        const propertyId = get(originalInput, ['property', 'connect', 'id'])
        if (propertyId) {
            const [property] = await Property.getAll(context, { id: propertyId })
            if (!property)
                return false

            const organizationIdFromProperty = get(property, ['organization', 'id'])
            if (organizationIdFromMeterEntity !== organizationIdFromProperty)
                return false
        }

        return await checkPermissionInUserOrganizationOrRelatedOrganization(context, user.id, organizationIdFromMeterEntity, 'canManageMeters')
    }

    return false
}

module.exports = {
    canReadMeterEntity,
    canManageMeterEntity,
}
