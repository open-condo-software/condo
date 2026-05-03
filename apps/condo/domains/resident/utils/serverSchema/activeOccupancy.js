const { find } = require('@open-condo/keystone/schema')

const { OCCUPANCY_STATUS_ACTIVE } = require('@condo/domains/resident/constants/occupancy')

function getToday () {
    return new Date().toISOString().slice(0, 10)
}

function isActiveOccupancyData ({ status, startDate, expectedEndDate, actualEndDate }, today = getToday()) {
    return status === OCCUPANCY_STATUS_ACTIVE
        && startDate <= today
        && !actualEndDate
        && (!expectedEndDate || expectedEndDate >= today)
}

function buildActiveOccupancyWhere ({ tenantId, tenantIds, userId, userPhone, propertyId, rentalUnitId, rentalUnitIds, today = getToday() } = {}) {
    const where = {
        status: OCCUPANCY_STATUS_ACTIVE,
        startDate_lte: today,
        actualEndDate: null,
        deletedAt: null,
        AND: [
            {
                OR: [
                    { expectedEndDate: null },
                    { expectedEndDate_gte: today },
                ],
            },
        ],
    }

    if (tenantId) {
        where.tenant = { id: tenantId }
    } else if (tenantIds) {
        where.tenant = { id_in: tenantIds }
    } else if (userId) {
        where.tenant = {
            user: { id: userId },
            deletedAt: null,
        }
    } else if (userPhone) {
        where.tenant = {
            user: { phone: userPhone },
            deletedAt: null,
        }
    }

    if (propertyId) {
        where.property = { id: propertyId }
    }

    if (rentalUnitId) {
        where.rentalUnit = { id: rentalUnitId }
    } else if (rentalUnitIds) {
        where.rentalUnit = { id_in: rentalUnitIds }
    }

    return where
}

async function findActiveOccupancies (params = {}) {
    return await find('Occupancy', buildActiveOccupancyWhere(params))
}

async function getActiveOccupancy (params = {}) {
    const [occupancy] = await findActiveOccupancies(params)

    return occupancy || null
}

async function getActiveOccupancyByGraphQL (context, { tenantId }, fields) {
    const today = getToday()
    const result = await Promise.resolve(context.executeGraphQL({
        context,
        query: `query ($tenantId: ID!, $today: CalendarDay) {
            occupancies(
                where: {
                    tenant: { id: $tenantId },
                    status: "active",
                    startDate_lte: $today,
                    actualEndDate: null,
                    OR: [
                        { expectedEndDate: null },
                        { expectedEndDate_gte: $today }
                    ],
                    deletedAt: null
                },
                first: 1
            ) {
                ${fields}
            }
        }`,
        variables: { tenantId, today },
    }))
    const data = result.data || result || {}
    const [occupancy] = data.occupancies || []

    return occupancy || null
}

module.exports = {
    buildActiveOccupancyWhere,
    findActiveOccupancies,
    getActiveOccupancy,
    getActiveOccupancyByGraphQL,
    isActiveOccupancyData,
}
