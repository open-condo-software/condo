const Big = require('big.js')
const get = require('lodash/get')

const { find } = require('@open-condo/keystone/schema')

const { LEDGER_ENTRY_STATUS_POSTED } = require('@condo/domains/billing/constants/ledger')
const {
    DEFAULT_RENT_CHARGE_CURRENCY_CODE,
    RENT_CHARGE_STATUS_CANCELED,
} = require('@condo/domains/billing/constants/rent')
const { getRentChargeOutstandingAmountFromAllocations } = require('@condo/domains/billing/utils/serverSchema/paymentAllocation')

function toMoney (amount) {
    return Big(amount || 0).toFixed(8)
}

async function calculateRentChargeOutstandingAmount (rentCharge) {
    return await getRentChargeOutstandingAmountFromAllocations(rentCharge)
}

function buildLedgerWhereFromRentChargeWhere (where) {
    const ledgerWhere = {}
    const organizationId = get(where, ['organization', 'id'])
    const tenantId = get(where, ['occupancy', 'tenant', 'id'])
    const occupancyId = get(where, ['occupancy', 'id'])
    const propertyId = get(where, ['property', 'id'])
    const rentalUnitId = get(where, ['rentalUnit', 'id'])

    if (organizationId) ledgerWhere.organization = { id: organizationId }
    if (tenantId) ledgerWhere.tenant = { id: tenantId }
    if (occupancyId) ledgerWhere.occupancy = { id: occupancyId }
    if (propertyId) ledgerWhere.property = { id: propertyId }
    if (rentalUnitId) ledgerWhere.rentalUnit = { id: rentalUnitId }

    return ledgerWhere
}

async function calculateLedgerBalanceByWhere (where) {
    const entries = await find('LedgerEntry', {
        ...where,
        postingStatus: LEDGER_ENTRY_STATUS_POSTED,
        deletedAt: null,
    })

    return entries.reduce((total, entry) => {
        const amount = Big(get(entry, 'amount') || 0)
        return get(entry, 'direction') === 'debit' ? total.plus(amount) : total.minus(amount)
    }, Big(0))
}

async function calculateArrearsByRentChargeWhere (where) {
    const rentCharges = await find('RentCharge', {
        ...where,
        status_not: RENT_CHARGE_STATUS_CANCELED,
        deletedAt: null,
    })

    const balance = await calculateLedgerBalanceByWhere(buildLedgerWhereFromRentChargeWhere(where))
    const amount = balance.gt(0) ? balance : Big(0)

    return {
        amount: toMoney(amount),
        currencyCode: DEFAULT_RENT_CHARGE_CURRENCY_CODE,
        chargeCount: rentCharges.length,
    }
}

async function calculateResidentArrears (residentId) {
    return await calculateArrearsByRentChargeWhere({
        occupancy: { tenant: { id: residentId } },
    })
}

async function calculateOccupancyArrears (occupancyId) {
    return await calculateArrearsByRentChargeWhere({
        occupancy: { id: occupancyId },
    })
}

async function calculateRentalUnitArrears (rentalUnitId) {
    return await calculateArrearsByRentChargeWhere({
        rentalUnit: { id: rentalUnitId },
    })
}

async function calculatePropertyArrears (propertyId) {
    return await calculateArrearsByRentChargeWhere({
        property: { id: propertyId },
    })
}

async function calculateOrganizationArrears (organizationId) {
    return await calculateArrearsByRentChargeWhere({
        organization: { id: organizationId },
    })
}

module.exports = {
    calculateArrearsByRentChargeWhere,
    calculateOccupancyArrears,
    calculateOrganizationArrears,
    calculatePropertyArrears,
    calculateRentChargeOutstandingAmount,
    calculateRentalUnitArrears,
    calculateResidentArrears,
    calculateLedgerBalanceByWhere,
}
