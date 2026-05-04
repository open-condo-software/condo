const Big = require('big.js')
const get = require('lodash/get')
const sortBy = require('lodash/sortBy')

const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { find, getById } = require('@open-condo/keystone/schema')

const {
    LEDGER_ENTRY_DIRECTION_CREDIT,
    LEDGER_ENTRY_DIRECTION_DEBIT,
    LEDGER_ENTRY_STATUS_POSTED,
    LEDGER_ENTRY_TYPE_CHARGE,
    LEDGER_ENTRY_TYPE_PAYMENT,
    LEDGER_ENTRY_TYPE_REVERSAL,
    TENANT_LEDGER_STATUS_ACTIVE,
} = require('@condo/domains/billing/constants/ledger')
const { DEFAULT_RENT_CHARGE_CURRENCY_CODE, RENT_CHARGE_STATUS_CANCELED, RENT_CHARGE_STATUS_PAID, RENT_CHARGE_STATUS_PARTIALLY_PAID } = require('@condo/domains/billing/constants/rent')

const LedgerEntry = generateServerUtils('LedgerEntry')
const PaymentAllocation = generateServerUtils('PaymentAllocation')
const PaymentReceipt = generateServerUtils('PaymentReceipt')
const RentCharge = generateServerUtils('RentCharge')
const TenantLedger = generateServerUtils('TenantLedger')

const DEFAULT_SENDER = { dv: 1, fingerprint: 'rentLedgerAccounting' }

function getRelationId (value) {
    return get(value, 'id') || value
}

function toMoney (amount) {
    return Big(amount || 0).toFixed(8)
}

function getSender (source) {
    return get(source, 'sender') || DEFAULT_SENDER
}

function getReceiptCode (organization) {
    const rawCode = get(organization, 'receiptCode') || get(organization, 'importId') || get(organization, 'name') || get(organization, 'id') || 'ORG'
    const normalized = String(rawCode).toUpperCase().replace(/[^A-Z0-9]/g, '')

    return normalized || 'ORG'
}

async function getOrCreateTenantLedger (context, { organizationId, tenantId, currencyCode = DEFAULT_RENT_CHARGE_CURRENCY_CODE, sender = DEFAULT_SENDER }) {
    const [existingLedger] = await find('TenantLedger', {
        organization: { id: organizationId },
        tenant: { id: tenantId },
        currencyCode,
        deletedAt: null,
    })

    if (existingLedger) return existingLedger

    try {
        return await TenantLedger.create(context, {
            dv: 1,
            sender,
            organization: { connect: { id: organizationId } },
            tenant: { connect: { id: tenantId } },
            currencyCode,
            status: TENANT_LEDGER_STATUS_ACTIVE,
        })
    } catch (err) {
        if (String(err.message).includes('tenant_ledger_unique_org_tenant_currency')) {
            const [ledger] = await find('TenantLedger', {
                organization: { id: organizationId },
                tenant: { id: tenantId },
                currencyCode,
                deletedAt: null,
            })

            return ledger
        }

        throw err
    }
}

async function findLedgerEntry (where) {
    const [entry] = await find('LedgerEntry', {
        ...where,
        deletedAt: null,
    })

    return entry
}

async function postRentChargeLedgerEntry (context, rentCharge, options = {}) {
    const tenantId = getRelationId(rentCharge.tenant)
    const organizationId = getRelationId(rentCharge.organization)
    const currencyCode = rentCharge.currencyCode || DEFAULT_RENT_CHARGE_CURRENCY_CODE
    const sender = options.sender || getSender(rentCharge)

    if (!tenantId || !organizationId) return null

    const existingEntry = await findLedgerEntry({
        rentCharge: { id: rentCharge.id },
        entryType: LEDGER_ENTRY_TYPE_CHARGE,
    })

    if (existingEntry) return existingEntry

    const ledger = await getOrCreateTenantLedger(context, { organizationId, tenantId, currencyCode, sender })

    return await LedgerEntry.create(context, {
        dv: 1,
        sender,
        ledger: { connect: { id: ledger.id } },
        organization: { connect: { id: organizationId } },
        tenant: { connect: { id: tenantId } },
        ...(rentCharge.occupancy ? { occupancy: { connect: { id: getRelationId(rentCharge.occupancy) } } } : {}),
        ...(rentCharge.property ? { property: { connect: { id: getRelationId(rentCharge.property) } } } : {}),
        ...(rentCharge.rentalUnit ? { rentalUnit: { connect: { id: getRelationId(rentCharge.rentalUnit) } } } : {}),
        rentCharge: { connect: { id: rentCharge.id } },
        entryType: LEDGER_ENTRY_TYPE_CHARGE,
        direction: LEDGER_ENTRY_DIRECTION_DEBIT,
        amount: rentCharge.amount,
        currencyCode,
        postingStatus: LEDGER_ENTRY_STATUS_POSTED,
        description: `Rent charge ${rentCharge.billingMonth}`,
    })
}

async function getChargeAllocatedAmount (rentChargeId) {
    const allocations = await find('PaymentAllocation', {
        rentCharge: { id: rentChargeId },
        deletedAt: null,
    })

    return allocations.reduce((total, allocation) => total.plus(allocation.amount || 0), Big(0))
}

async function getPaymentAllocatedAmount (paymentId) {
    const allocations = await find('PaymentAllocation', {
        payment: { id: paymentId },
        deletedAt: null,
    })

    return allocations.reduce((total, allocation) => total.plus(allocation.amount || 0), Big(0))
}

async function getRentChargeOutstandingAmountFromAllocations (rentCharge) {
    const allocated = await getChargeAllocatedAmount(rentCharge.id)
    const outstanding = Big(rentCharge.amount || 0).minus(allocated)

    return outstanding.gt(0) ? outstanding : Big(0)
}

async function createPaymentReceipt (context, payment, ledger, options = {}) {
    const [existingReceipt] = await find('PaymentReceipt', {
        payment: { id: payment.id },
        deletedAt: null,
    })

    if (existingReceipt) return existingReceipt

    const issuedAt = payment.confirmedAt || payment.advancedAt || new Date().toISOString()
    const year = new Date(issuedAt).getUTCFullYear()
    const organizationId = getRelationId(payment.organization)
    const organization = await getById('Organization', organizationId)
    const organizationCode = getReceiptCode(organization)
    const existingReceipts = await find('PaymentReceipt', {
        organization: { id: organizationId },
        year,
        deletedAt: null,
    })
    const sequence = existingReceipts.reduce((max, receipt) => Math.max(max, Number(receipt.sequence) || 0), 0) + 1
    const number = `${organizationCode}/${year}/${sequence}`
    const sender = options.sender || getSender(payment)

    return await PaymentReceipt.create(context, {
        dv: 1,
        sender,
        organization: { connect: { id: organizationId } },
        tenant: { connect: { id: getRelationId(payment.tenant) } },
        payment: { connect: { id: payment.id } },
        ledger: { connect: { id: ledger.id } },
        number,
        year,
        sequence,
        amount: payment.amount,
        currencyCode: payment.currencyCode || DEFAULT_RENT_CHARGE_CURRENCY_CODE,
        issuedAt,
        ...(payment.paymentMethod ? { paymentMethod: payment.paymentMethod } : {}),
        ...(payment.provider ? { provider: payment.provider } : {}),
    })
}

async function postPaymentLedgerEntry (context, payment, ledger, receipt, options = {}) {
    const existingEntry = await findLedgerEntry({
        payment: { id: payment.id },
        entryType: LEDGER_ENTRY_TYPE_PAYMENT,
    })

    if (existingEntry) return existingEntry

    const organizationId = getRelationId(payment.organization)
    const tenantId = getRelationId(payment.tenant)
    const sender = options.sender || getSender(payment)

    return await LedgerEntry.create(context, {
        dv: 1,
        sender,
        ledger: { connect: { id: ledger.id } },
        organization: { connect: { id: organizationId } },
        tenant: { connect: { id: tenantId } },
        ...(payment.occupancy ? { occupancy: { connect: { id: getRelationId(payment.occupancy) } } } : {}),
        ...(payment.property ? { property: { connect: { id: getRelationId(payment.property) } } } : {}),
        ...(payment.rentalUnit ? { rentalUnit: { connect: { id: getRelationId(payment.rentalUnit) } } } : {}),
        payment: { connect: { id: payment.id } },
        ...(receipt ? { receipt: { connect: { id: receipt.id } } } : {}),
        entryType: LEDGER_ENTRY_TYPE_PAYMENT,
        direction: LEDGER_ENTRY_DIRECTION_CREDIT,
        amount: payment.amount,
        currencyCode: payment.currencyCode || DEFAULT_RENT_CHARGE_CURRENCY_CODE,
        postingStatus: LEDGER_ENTRY_STATUS_POSTED,
        description: `Payment ${payment.id}`,
    })
}

async function updateRentChargeStatus (context, rentCharge, outstandingAmount, sender) {
    let status = rentCharge.status

    if (outstandingAmount.eq(0)) {
        status = RENT_CHARGE_STATUS_PAID
    } else if (outstandingAmount.lt(rentCharge.amount || 0)) {
        status = RENT_CHARGE_STATUS_PARTIALLY_PAID
    }

    if (status !== rentCharge.status) {
        await RentCharge.update(context, rentCharge.id, {
            dv: 1,
            sender,
            status,
        })
    }
}

async function allocatePaymentToOldestCharges (context, payment, ledger, paymentLedgerEntry, options = {}) {
    const tenantId = getRelationId(payment.tenant)
    const organizationId = getRelationId(payment.organization)
    const currencyCode = payment.currencyCode || DEFAULT_RENT_CHARGE_CURRENCY_CODE
    const sender = options.sender || getSender(payment)
    const alreadyAllocated = await getPaymentAllocatedAmount(payment.id)
    let remaining = Big(payment.amount || 0).minus(alreadyAllocated)
    const allocations = []

    if (!remaining.gt(0)) {
        return { allocations, allocatedAmount: toMoney(alreadyAllocated), unallocatedAmount: toMoney(Big(0)) }
    }

    const rentCharges = sortBy(await find('RentCharge', {
        organization: { id: organizationId },
        tenant: { id: tenantId },
        currencyCode,
        status_not: RENT_CHARGE_STATUS_CANCELED,
        deletedAt: null,
    }), ['dueDate', 'billingMonth', 'createdAt'])

    for (const rentCharge of rentCharges) {
        if (!remaining.gt(0)) break

        const outstanding = await getRentChargeOutstandingAmountFromAllocations(rentCharge)
        if (!outstanding.gt(0)) continue

        const allocationAmount = remaining.lt(outstanding) ? remaining : outstanding
        const allocation = await PaymentAllocation.create(context, {
            dv: 1,
            sender,
            organization: { connect: { id: organizationId } },
            payment: { connect: { id: payment.id } },
            rentCharge: { connect: { id: rentCharge.id } },
            ledger: { connect: { id: ledger.id } },
            ledgerEntry: { connect: { id: paymentLedgerEntry.id } },
            amount: allocationAmount.toString(),
            currencyCode,
        })

        allocations.push(allocation)
        remaining = remaining.minus(allocationAmount)
        await updateRentChargeStatus(context, rentCharge, outstanding.minus(allocationAmount), sender)
    }

    return {
        allocations,
        allocatedAmount: toMoney(Big(payment.amount || 0).minus(remaining)),
        unallocatedAmount: toMoney(remaining),
    }
}

async function processConfirmedRentPayment (context, payment, options = {}) {
    const organizationId = getRelationId(payment.organization)
    const tenantId = getRelationId(payment.tenant)
    const currencyCode = payment.currencyCode || DEFAULT_RENT_CHARGE_CURRENCY_CODE
    const sender = options.sender || getSender(payment)

    if (!organizationId || !tenantId) return null

    const ledger = await getOrCreateTenantLedger(context, { organizationId, tenantId, currencyCode, sender })
    const receipt = await createPaymentReceipt(context, payment, ledger, { sender })
    const paymentLedgerEntry = await postPaymentLedgerEntry(context, payment, ledger, receipt, { sender })
    const allocationResult = await allocatePaymentToOldestCharges(context, payment, ledger, paymentLedgerEntry, { sender })

    return {
        ledger,
        receipt,
        paymentLedgerEntry,
        ...allocationResult,
    }
}

async function calculateLedgerBalance (where) {
    const entries = await find('LedgerEntry', {
        ...where,
        postingStatus: LEDGER_ENTRY_STATUS_POSTED,
        deletedAt: null,
    })
    const balance = entries.reduce((total, entry) => {
        const amount = Big(entry.amount || 0)
        return entry.direction === LEDGER_ENTRY_DIRECTION_DEBIT ? total.plus(amount) : total.minus(amount)
    }, Big(0))

    return toMoney(balance)
}

async function createReversalEntry (context, ledgerEntryId, options = {}) {
    const originalEntry = await getById('LedgerEntry', ledgerEntryId)
    const sender = options.sender || getSender(originalEntry)
    const direction = originalEntry.direction === LEDGER_ENTRY_DIRECTION_DEBIT ? LEDGER_ENTRY_DIRECTION_CREDIT : LEDGER_ENTRY_DIRECTION_DEBIT

    return await LedgerEntry.create(context, {
        dv: 1,
        sender,
        ledger: { connect: { id: getRelationId(originalEntry.ledger) } },
        organization: { connect: { id: getRelationId(originalEntry.organization) } },
        tenant: { connect: { id: getRelationId(originalEntry.tenant) } },
        ...(originalEntry.occupancy ? { occupancy: { connect: { id: getRelationId(originalEntry.occupancy) } } } : {}),
        ...(originalEntry.property ? { property: { connect: { id: getRelationId(originalEntry.property) } } } : {}),
        ...(originalEntry.rentalUnit ? { rentalUnit: { connect: { id: getRelationId(originalEntry.rentalUnit) } } } : {}),
        ...(originalEntry.rentCharge ? { rentCharge: { connect: { id: getRelationId(originalEntry.rentCharge) } } } : {}),
        ...(originalEntry.payment ? { payment: { connect: { id: getRelationId(originalEntry.payment) } } } : {}),
        entryType: LEDGER_ENTRY_TYPE_REVERSAL,
        direction,
        amount: originalEntry.amount,
        currencyCode: originalEntry.currencyCode,
        postingStatus: LEDGER_ENTRY_STATUS_POSTED,
        reversesEntry: { connect: { id: originalEntry.id } },
        description: `Reversal of ledger entry ${originalEntry.id}`,
    })
}

module.exports = {
    allocatePaymentToOldestCharges,
    calculateLedgerBalance,
    createPaymentReceipt,
    createReversalEntry,
    getChargeAllocatedAmount,
    getOrCreateTenantLedger,
    getPaymentAllocatedAmount,
    getRentChargeOutstandingAmountFromAllocations,
    postPaymentLedgerEntry,
    postRentChargeLedgerEntry,
    processConfirmedRentPayment,
}