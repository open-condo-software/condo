const Big = require('big.js')
const get = require('lodash/get')
const uniq = require('lodash/uniq')

const { find, getById } = require('@open-condo/keystone/schema')

const {
    DEFAULT_RENT_CHARGE_CURRENCY_CODE,
    RENT_CHARGE_STATUS_CANCELED,
} = require('@condo/domains/billing/constants/rent')
const {
    calculateOrganizationArrears,
    calculateRentChargeOutstandingAmount,
    calculateResidentArrears,
} = require('@condo/domains/billing/utils/serverSchema/arrears')
const { INVOICE_STATUS_CANCELED, INVOICE_STATUS_PAID } = require('@condo/domains/marketplace/constants')
const {
    RENTAL_UNIT_TYPE_BED,
    RENTAL_UNIT_TYPE_ROOM,
} = require('@condo/domains/property/constants/rental')
const {
    OCCUPANCY_STATUS_ACTIVE,
    OCCUPANCY_STATUS_PLANNED,
} = require('@condo/domains/resident/constants/occupancy')
const {
    buildActiveOccupancyWhere,
    findActiveOccupancies,
    getActiveOccupancy,
} = require('@condo/domains/resident/utils/serverSchema/activeOccupancy')

const BLOCKING_OCCUPANCY_STATUSES = [OCCUPANCY_STATUS_ACTIVE, OCCUPANCY_STATUS_PLANNED]
const OPEN_END_DATE = '9999-12-31'

function getToday () {
    return new Date().toISOString().slice(0, 10)
}

function getRelationId (value) {
    return get(value, 'id') || value
}

async function getRelatedItem (listKey, value) {
    if (!value) return null
    if (get(value, 'id')) return value

    return await getById(listKey, value)
}

function toMoney (amount) {
    return Big(amount || 0).toFixed(8)
}

function buildInterval ({ startDate, expectedEndDate } = {}) {
    return {
        startDate: startDate || getToday(),
        endDate: expectedEndDate || OPEN_END_DATE,
    }
}

function getOccupancyEndDate (occupancy) {
    return get(occupancy, 'actualEndDate') || get(occupancy, 'expectedEndDate') || OPEN_END_DATE
}

function isOccupancyOverlappingInterval (occupancy, interval) {
    const occupancyStart = get(occupancy, 'startDate')
    const occupancyEnd = getOccupancyEndDate(occupancy)

    return occupancyStart <= interval.endDate && occupancyEnd >= interval.startDate
}

function buildRentalUnitWhere ({ organizationId, propertyId, unitType, unitTypes } = {}) {
    const where = {
        rentable: true,
        deletedAt: null,
    }

    if (organizationId) {
        where.organization = { id: organizationId }
    }

    if (propertyId) {
        where.property = { id: propertyId }
    }

    if (unitType) {
        where.unitType = unitType
    } else if (unitTypes) {
        where.unitType_in = unitTypes
    }

    return where
}

function buildBlockingOccupancyWhere ({ organizationId, propertyId, rentalUnitIds }) {
    const where = {
        status_in: BLOCKING_OCCUPANCY_STATUSES,
        deletedAt: null,
    }

    if (organizationId) {
        where.organization = { id: organizationId }
    }

    if (propertyId) {
        where.property = { id: propertyId }
    }

    if (rentalUnitIds) {
        where.rentalUnit = { id_in: rentalUnitIds }
    }

    return where
}

async function getBlockingOccupancyCounts ({ organizationId, propertyId, rentalUnitIds, interval }) {
    if (!rentalUnitIds || rentalUnitIds.length === 0) return {}

    const occupancies = await find('Occupancy', buildBlockingOccupancyWhere({
        organizationId,
        propertyId,
        rentalUnitIds,
    }))

    return occupancies.reduce((result, occupancy) => {
        if (!isOccupancyOverlappingInterval(occupancy, interval)) return result

        const rentalUnitId = getRelationId(occupancy.rentalUnit)
        result[rentalUnitId] = (result[rentalUnitId] || 0) + 1

        return result
    }, {})
}

async function findAvailableRentalUnits (params = {}) {
    const rentalUnits = await find('RentalUnit', buildRentalUnitWhere(params))
    const interval = buildInterval(params)
    const occupancyCounts = await getBlockingOccupancyCounts({
        organizationId: params.organizationId,
        propertyId: params.propertyId,
        rentalUnitIds: rentalUnits.map(unit => unit.id),
        interval,
    })

    return rentalUnits
        .map(rentalUnit => {
            const capacity = Number(get(rentalUnit, 'capacity') || 0)
            const occupiedCount = occupancyCounts[rentalUnit.id] || 0
            const availableCapacity = Math.max(capacity - occupiedCount, 0)

            return {
                rentalUnit,
                capacity,
                occupiedCount,
                availableCapacity,
            }
        })
        .filter(item => item.availableCapacity > 0)
}

async function findAvailableHostelBeds (params = {}) {
    return await findAvailableRentalUnits({
        ...params,
        unitTypes: [RENTAL_UNIT_TYPE_ROOM, RENTAL_UNIT_TYPE_BED],
    })
}

async function findActiveOccupancyByProperty (propertyId, params = {}) {
    return await findActiveOccupancies({
        ...params,
        propertyId,
    })
}

async function findActiveOccupancyByRentalUnit (rentalUnitId, params = {}) {
    return await findActiveOccupancies({
        ...params,
        rentalUnitId,
    })
}

async function findOccupiedRentalUnits ({ organizationId, propertyId, today = getToday() } = {}) {
    const occupancies = await find('Occupancy', buildActiveOccupancyWhere({ propertyId, today }))
    const filteredOccupancies = organizationId
        ? occupancies.filter(occupancy => getRelationId(occupancy.organization) === organizationId)
        : occupancies

    return await Promise.all(filteredOccupancies.map(buildRentalOccupancySummary))
}

async function findExpiringOccupancies ({ organizationId, propertyId, dateFrom = getToday(), dateTo } = {}) {
    const where = {
        status: OCCUPANCY_STATUS_ACTIVE,
        actualEndDate: null,
        expectedEndDate_gte: dateFrom,
        deletedAt: null,
    }

    if (dateTo) {
        where.expectedEndDate_lte = dateTo
    }

    if (organizationId) {
        where.organization = { id: organizationId }
    }

    if (propertyId) {
        where.property = { id: propertyId }
    }

    const occupancies = await find('Occupancy', where)

    return await Promise.all(occupancies.map(buildRentalOccupancySummary))
}

async function buildRentalOccupancySummary (occupancy) {
    return {
        occupancy,
        resident: await getRelatedItem('Resident', occupancy.tenant),
        rentalUnit: await getRelatedItem('RentalUnit', occupancy.rentalUnit),
        property: await getRelatedItem('Property', occupancy.property),
    }
}

async function getUnpaidRentChargeData (rentCharges) {
    const unpaidRentCharges = []
    const linkedUnpaidInvoices = []
    let arrearsTotal = Big(0)

    for (const rentCharge of rentCharges) {
        const outstanding = await calculateRentChargeOutstandingAmount(rentCharge)

        if (!outstanding.gt(0)) continue

        unpaidRentCharges.push(rentCharge)
        arrearsTotal = arrearsTotal.plus(outstanding)

        const invoiceId = getRelationId(rentCharge.invoice)
        if (invoiceId) {
            const invoice = await getById('Invoice', invoiceId)

            if (invoice && ![INVOICE_STATUS_PAID, INVOICE_STATUS_CANCELED].includes(invoice.status)) {
                linkedUnpaidInvoices.push(invoice)
            }
        }
    }

    return {
        unpaidRentCharges,
        linkedUnpaidInvoices,
        arrearsTotal: toMoney(arrearsTotal),
        nextDueDate: getNextDueDate(unpaidRentCharges),
    }
}

function getNextDueDate (rentCharges, today = getToday()) {
    const dueDates = rentCharges
        .map(rentCharge => rentCharge.dueDate)
        .filter(Boolean)
        .sort()

    return dueDates.find(dueDate => dueDate >= today) || dueDates[0] || null
}

async function getResidentCurrentOccupancySummary (residentId, params = {}) {
    const occupancy = await getActiveOccupancy({
        tenantId: residentId,
        today: params.today,
    })

    if (!occupancy) {
        return {
            currentRentalUnit: null,
            occupancyStatus: null,
            billingFrequency: null,
            monthlyRate: null,
            unpaidRentCharges: [],
            linkedUnpaidInvoices: [],
            arrearsTotal: '0.00000000',
            nextDueDate: null,
        }
    }

    const rentCharges = await find('RentCharge', {
        occupancy: { id: occupancy.id },
        status_not: RENT_CHARGE_STATUS_CANCELED,
        deletedAt: null,
    })
    const unpaidData = await getUnpaidRentChargeData(rentCharges)

    return {
        currentRentalUnit: await getRelatedItem('RentalUnit', occupancy.rentalUnit),
        occupancyStatus: occupancy.status,
        billingFrequency: occupancy.billingFrequency,
        monthlyRate: occupancy.monthlyRate,
        unpaidRentCharges: unpaidData.unpaidRentCharges,
        linkedUnpaidInvoices: unpaidData.linkedUnpaidInvoices,
        arrearsTotal: unpaidData.arrearsTotal,
        nextDueDate: unpaidData.nextDueDate,
    }
}

async function getResidentArrearsSummary (residentId) {
    return await calculateResidentArrears(residentId)
}

async function getPropertyOccupancySummary ({ organizationId, propertyId, today = getToday() } = {}) {
    const rentalUnits = await find('RentalUnit', buildRentalUnitWhere({ organizationId, propertyId }))
    const activeOccupancies = await findActiveOccupancyByProperty(propertyId, { today })
    const scopedOccupancies = organizationId
        ? activeOccupancies.filter(occupancy => getRelationId(occupancy.organization) === organizationId)
        : activeOccupancies
    const occupiedCounts = scopedOccupancies.reduce((result, occupancy) => {
        const rentalUnitId = getRelationId(occupancy.rentalUnit)
        result[rentalUnitId] = (result[rentalUnitId] || 0) + 1

        return result
    }, {})

    const totalCapacity = rentalUnits.reduce((sum, unit) => sum + Number(unit.capacity || 0), 0)
    const occupiedCapacity = Object.values(occupiedCounts).reduce((sum, count) => sum + count, 0)
    const occupiedUnitIds = Object.keys(occupiedCounts)
    const availableUnitsCount = rentalUnits.filter(unit => Number(unit.capacity || 0) > (occupiedCounts[unit.id] || 0)).length

    return {
        totalRentableUnits: rentalUnits.length,
        occupiedUnits: occupiedUnitIds.length,
        availableUnits: availableUnitsCount,
        totalCapacity,
        occupiedCapacity,
        availableCapacity: Math.max(totalCapacity - occupiedCapacity, 0),
    }
}

async function getOrganizationRentArrearsSummary (organizationId) {
    const rentCharges = await find('RentCharge', {
        organization: { id: organizationId },
        status_not: RENT_CHARGE_STATUS_CANCELED,
        deletedAt: null,
    })
    const occupancyIds = uniq(rentCharges.map(rentCharge => getRelationId(rentCharge.occupancy)).filter(Boolean))
    const occupancies = occupancyIds.length > 0
        ? await find('Occupancy', { id_in: occupancyIds, deletedAt: null })
        : []
    const occupancyById = occupancies.reduce((result, occupancy) => {
        result[occupancy.id] = occupancy

        return result
    }, {})
    const residentIdsWithArrears = []
    let rentChargedTotal = Big(0)

    for (const rentCharge of rentCharges) {
        rentChargedTotal = rentChargedTotal.plus(rentCharge.amount || 0)

        const outstanding = await calculateRentChargeOutstandingAmount(rentCharge)
        if (!outstanding.gt(0)) continue

        const occupancy = occupancyById[getRelationId(rentCharge.occupancy)] || get(rentCharge, 'occupancy')
        const residentId = getRelationId(get(occupancy, 'tenant'))
        if (residentId) {
            residentIdsWithArrears.push(residentId)
        }
    }

    const arrears = await calculateOrganizationArrears(organizationId)

    return {
        rentChargedTotal: toMoney(rentChargedTotal),
        arrearsTotal: arrears.amount,
        currencyCode: arrears.currencyCode || DEFAULT_RENT_CHARGE_CURRENCY_CODE,
        residentsWithArrearsCount: uniq(residentIdsWithArrears).length,
    }
}

async function findResidentsWithArrears ({ organizationId, propertyId } = {}) {
    const where = {
        status_not: RENT_CHARGE_STATUS_CANCELED,
        deletedAt: null,
    }

    if (organizationId) {
        where.organization = { id: organizationId }
    }

    if (propertyId) {
        where.property = { id: propertyId }
    }

    const rentCharges = await find('RentCharge', where)
    const occupancyIds = uniq(rentCharges.map(rentCharge => getRelationId(rentCharge.occupancy)).filter(Boolean))
    const occupancies = occupancyIds.length > 0
        ? await find('Occupancy', { id_in: occupancyIds, deletedAt: null })
        : []
    const occupancyById = occupancies.reduce((result, occupancy) => {
        result[occupancy.id] = occupancy

        return result
    }, {})
    const residentIds = []

    for (const rentCharge of rentCharges) {
        const outstanding = await calculateRentChargeOutstandingAmount(rentCharge)
        if (!outstanding.gt(0)) continue

        const occupancy = occupancyById[getRelationId(rentCharge.occupancy)] || get(rentCharge, 'occupancy')
        const residentId = getRelationId(get(occupancy, 'tenant'))

        if (residentId) {
            residentIds.push(residentId)
        }
    }

    const uniqueResidentIds = uniq(residentIds)
    const result = []

    for (const residentId of uniqueResidentIds) {
        const resident = await getById('Resident', residentId)
        const currentOccupancy = await getActiveOccupancy({ tenantId: residentId })
        const arrears = await calculateResidentArrears(residentId)

        result.push({
            resident,
            currentOccupancy,
            arrearsTotal: arrears.amount,
            currencyCode: arrears.currencyCode,
            chargeCount: arrears.chargeCount,
        })
    }

    return result
}

module.exports = {
    buildInterval,
    findActiveOccupancyByProperty,
    findActiveOccupancyByRentalUnit,
    findAvailableHostelBeds,
    findAvailableRentalUnits,
    findExpiringOccupancies,
    findOccupiedRentalUnits,
    findResidentsWithArrears,
    getOrganizationRentArrearsSummary,
    getPropertyOccupancySummary,
    getResidentArrearsSummary,
    getResidentCurrentOccupancySummary,
    isOccupancyOverlappingInterval,
}
