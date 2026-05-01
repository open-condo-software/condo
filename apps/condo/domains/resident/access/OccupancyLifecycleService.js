const get = require('lodash/get')

const { getById } = require('@open-condo/keystone/schema')

const { canManageOccupancies } = require('@condo/domains/resident/access/Occupancy')

async function canManageOccupancyLifecycle (accessArgs) {
    let organizationId = get(accessArgs, ['args', 'data', 'organizationId'])
    const occupancyId = get(accessArgs, ['args', 'data', 'occupancyId'])

    if (!organizationId && !occupancyId) {
        const rentalUnitId = get(accessArgs, ['args', 'data', 'rentalUnitId']) || get(accessArgs, ['args', 'data', 'targetRentalUnitId'])
        const rentalUnit = rentalUnitId && await getById('RentalUnit', rentalUnitId)
        organizationId = get(rentalUnit, 'organization')
    }

    const originalInput = organizationId ? {
        organization: { connect: { id: organizationId } },
    } : {}

    return await canManageOccupancies({
        ...accessArgs,
        originalInput,
        operation: occupancyId ? 'update' : 'create',
        itemId: occupancyId,
        listKey: 'Occupancy',
    })
}

module.exports = {
    canManageOccupancyLifecycle,
}
