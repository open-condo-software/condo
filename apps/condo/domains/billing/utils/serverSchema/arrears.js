const Big = require('big.js')
const get = require('lodash/get')

const { find, getById } = require('@open-condo/keystone/schema')

const { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } = require('@condo/domains/acquiring/constants/payment')
const {
    DEFAULT_RENT_CHARGE_CURRENCY_CODE,
    RENT_CHARGE_STATUS_CANCELED,
} = require('@condo/domains/billing/constants/rent')
const { INVOICE_STATUS_PAID } = require('@condo/domains/marketplace/constants')

function getRelationId (value) {
    return get(value, 'id') || value
}

function toMoney (amount) {
    return Big(amount || 0).toFixed(8)
}

async function getInvoicePaymentsAmount (invoiceId) {
    const payments = await find('Payment', {
        invoice: { id: invoiceId },
        status_in: [PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS],
        deletedAt: null,
    })

    return payments.reduce((total, payment) => total.plus(payment.amount || 0), Big(0))
}

async function calculateRentChargeOutstandingAmount (rentCharge) {
    const invoiceId = getRelationId(rentCharge.invoice)

    if (invoiceId) {
        const invoice = await getById('Invoice', invoiceId)

        if (get(invoice, 'status') === INVOICE_STATUS_PAID) {
            return Big(0)
        }
    }

    const billingReceiptId = getRelationId(rentCharge.billingReceipt)

    if (billingReceiptId) {
        const billingReceipt = await getById('BillingReceipt', billingReceiptId)
        const outstanding = Big(get(billingReceipt, 'toPay') || 0).minus(get(billingReceipt, 'paid') || 0)

        return outstanding.gt(0) ? outstanding : Big(0)
    }

    const chargedAmount = Big(get(rentCharge, 'amount') || 0)

    if (invoiceId) {
        const paidAmount = await getInvoicePaymentsAmount(invoiceId)
        const outstanding = chargedAmount.minus(paidAmount)

        return outstanding.gt(0) ? outstanding : Big(0)
    }

    return chargedAmount
}

async function calculateArrearsByRentChargeWhere (where) {
    const rentCharges = await find('RentCharge', {
        ...where,
        status_not: RENT_CHARGE_STATUS_CANCELED,
        deletedAt: null,
    })

    let amount = Big(0)

    for (const rentCharge of rentCharges) {
        amount = amount.plus(await calculateRentChargeOutstandingAmount(rentCharge))
    }

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
}
