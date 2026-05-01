const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById } = require('@open-condo/keystone/schema')

const { canReadRentalUnits } = require('@condo/domains/property/access/RentalUnit')
const { canReadOccupancies } = require('@condo/domains/resident/access/Occupancy')
const { canReadResidents } = require('@condo/domains/resident/access/Resident')
const { RESIDENT } = require('@condo/domains/user/constants/common')

function isAccessAllowedByScope (accessResult, { organizationId, propertyId } = {}) {
    if (accessResult === true) return true
    if (!accessResult) return false
    if (Object.keys(accessResult).length === 0) return true

    const organizationIds = get(accessResult, ['organization', 'id_in'])
    if (organizationId && Array.isArray(organizationIds)) {
        return organizationIds.includes(organizationId)
    }

    const propertyIds = get(accessResult, ['property', 'id_in'])
    if (propertyId && Array.isArray(propertyIds)) {
        return propertyIds.includes(propertyId)
    }

    return false
}

async function canReadRentalOperations (accessArgs) {
    const user = get(accessArgs, ['authentication', 'item'])
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    const data = get(accessArgs, ['args', 'data'], {})
    const accessResult = await canReadRentalUnits({
        ...accessArgs,
        listKey: 'RentalUnit',
    })

    return isAccessAllowedByScope(accessResult, {
        organizationId: data.organizationId,
        propertyId: data.propertyId,
    })
}

async function canReadRentalOccupancyOperations (accessArgs) {
    const user = get(accessArgs, ['authentication', 'item'])
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    const data = get(accessArgs, ['args', 'data'], {})
    const accessResult = await canReadOccupancies({
        ...accessArgs,
        listKey: 'Occupancy',
    })

    return isAccessAllowedByScope(accessResult, {
        organizationId: data.organizationId,
        propertyId: data.propertyId,
    })
}

async function canReadResidentRentalDashboard (accessArgs) {
    const user = get(accessArgs, ['authentication', 'item'])
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    const residentId = get(accessArgs, ['args', 'data', 'residentId'])
    const resident = residentId && await getById('Resident', residentId)
    if (!resident || resident.deletedAt) return false

    if (user.type === RESIDENT) {
        return resident.user === user.id
    }

    const residentAccess = await canReadResidents({
        ...accessArgs,
        listKey: 'Resident',
    })
    if (residentAccess === true || (residentAccess && Object.keys(residentAccess).length === 0)) {
        return true
    }

    const occupancyAccess = await canReadOccupancies({
        ...accessArgs,
        listKey: 'Occupancy',
    })

    return isAccessAllowedByScope(occupancyAccess, {
        organizationId: resident.organization,
        propertyId: resident.property,
    })
}

module.exports = {
    canReadRentalOccupancyOperations,
    canReadRentalOperations,
    canReadResidentRentalDashboard,
}
