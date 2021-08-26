const { checkRelatedOrganizationPermission } = require('../../organization/utils/accessSchema')
const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const get = require('lodash/get')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { queryOrganizationEmployeeFromRelatedOrganizationFor } = require('@condo/domains/organization/utils/accessSchema')
const { queryOrganizationEmployeeFor } = require('@condo/domains/organization/utils/accessSchema')

async function canReadMeterEntity ({ user }) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) {
        return {}
    }
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
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return true
    if (operation === 'create') {
        const organizationIdFromEntity = get(originalInput, ['organization', 'connect', 'id'])
        if (!organizationIdFromEntity) {
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
        const canManageRelatedOrganizationTickets = await checkRelatedOrganizationPermission(context, user.id, organizationIdFromEntity, 'canManageMeters')
        if (canManageRelatedOrganizationTickets) {
            return true
        }
        const organizationIdFromProperty = get(property, ['organization', 'id'])
        const canManageMeterReadings = await checkOrganizationPermission(context, user.id, organizationIdFromEntity, 'canManageMeters')
        if (!canManageMeterReadings) {
            return false
        }

        return organizationIdFromEntity === organizationIdFromProperty

    } else if (operation === 'update') {
        if (!itemId) {
            return false
        }
        const [entity] = await schema.getAll(context, { id: itemId })
        if (!entity) {
            return false
        }

        const organizationIdFromMeterReading = get(entity, ['organization', 'id'])

        const canManageRelatedOrganizationTickets = await checkRelatedOrganizationPermission(context, user.id, organizationIdFromMeterReading, 'canManageMeters')
        if (canManageRelatedOrganizationTickets) {
            return true
        }
        const canManageMeters = await checkOrganizationPermission(context, user.id, organizationIdFromMeterReading, 'canManageMeters')
        if (!canManageMeters) {
            return false
        }

        const propertyId = get(originalInput, ['property', 'connect', 'id'])
        if (propertyId) {
            const [property] = await Property.getAll(context, { id: propertyId })
            if (!property) {
                return false
            }

            const organizationIdFromProperty = get(property, ['organization', 'id'])
            const isSameOrganization = organizationIdFromMeterReading === organizationIdFromProperty

            if (!isSameOrganization) {
                return false
            }
        }

        return true
    }

    return false
}

module.exports = {
    canReadMeterEntity,
    canManageMeterEntity,
}
