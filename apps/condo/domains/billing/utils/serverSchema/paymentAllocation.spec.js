/**
 * @jest-environment node
 */

const stores = {}
const counters = {}

function resetStores () {
    for (const listKey of ['TenantLedger', 'LedgerEntry', 'PaymentAllocation', 'PaymentReceipt', 'RentCharge', 'Organization']) {
        stores[listKey] = []
        counters[listKey] = 0
    }
}

function getRelationId (value) {
    return value && value.id ? value.id : value
}

function flattenRelations (data) {
    const result = { ...data }
    for (const [key, value] of Object.entries(result)) {
        if (value && value.connect && value.connect.id) {
            result[key] = value.connect.id
        }
    }

    return result
}

function matchesWhere (item, where) {
    return Object.entries(where).every(([key, value]) => {
        if (key === 'deletedAt') return item.deletedAt === value
        if (key.endsWith('_not')) return item[key.slice(0, -4)] !== value
        if (value && typeof value === 'object' && value.id) return getRelationId(item[key]) === value.id
        return item[key] === value
    })
}

const mockFind = jest.fn(async (listKey, where) => stores[listKey].filter(item => matchesWhere(item, where)))
const mockGetById = jest.fn(async (listKey, id) => stores[listKey].find(item => item.id === id))

jest.mock('@open-condo/keystone/schema', () => ({
    find: mockFind,
    getById: mockGetById,
}))

jest.mock('@open-condo/codegen/generate.server.utils', () => ({
    generateServerUtils: jest.fn((listKey) => ({
        create: jest.fn(async (context, data) => {
            counters[listKey] += 1
            const item = {
                id: `${listKey}-${counters[listKey]}`,
                ...flattenRelations(data),
                deletedAt: null,
            }
            stores[listKey].push(item)
            return item
        }),
        update: jest.fn(async (context, id, data) => {
            const item = stores[listKey].find(item => item.id === id)
            Object.assign(item, flattenRelations(data))
            return item
        }),
    })),
}))

const {
    calculateLedgerBalance,
    createReversalEntry,
    postRentChargeLedgerEntry,
    processConfirmedRentPayment,
    reverseConfirmedRentPayment,
} = require('./paymentAllocation')

const organizationId = 'organization'
const tenantId = 'tenant'
const propertyId = 'property'
const rentalUnitId = 'rental-unit'
const occupancyId = 'occupancy'
const sender = { dv: 1, fingerprint: 'test' }

function addRentCharge (attrs) {
    const charge = {
        id: `charge-${stores.RentCharge.length + 1}`,
        organization: organizationId,
        tenant: tenantId,
        property: propertyId,
        rentalUnit: rentalUnitId,
        occupancy: occupancyId,
        amount: '100',
        currencyCode: 'GHS',
        status: 'draft',
        dueDate: '2026-01-01',
        billingMonth: '2026-01-01',
        sender,
        deletedAt: null,
        ...attrs,
    }
    stores.RentCharge.push(charge)
    return charge
}

async function postCharges (context, charges) {
    for (const charge of charges) {
        await postRentChargeLedgerEntry(context, charge, { sender })
    }
}

function buildPayment (amount) {
    return {
        id: 'payment',
        organization: organizationId,
        tenant: tenantId,
        property: propertyId,
        rentalUnit: rentalUnitId,
        occupancy: occupancyId,
        amount,
        currencyCode: 'GHS',
        paymentMethod: 'momo',
        provider: 'paystack',
        confirmedAt: '2026-05-03T00:00:00.000Z',
        sender,
    }
}

describe('paymentAllocation', () => {
    beforeEach(() => {
        resetStores()
        jest.clearAllMocks()
        stores.Organization.push({ id: organizationId, receiptCode: 'KONDO', deletedAt: null })
    })

    test('allocates one payment across oldest unpaid rent charges', async () => {
        const context = {}
        const firstCharge = addRentCharge({ dueDate: '2026-01-01', billingMonth: '2026-01-01' })
        const secondCharge = addRentCharge({ dueDate: '2026-02-01', billingMonth: '2026-02-01' })
        await postCharges(context, [firstCharge, secondCharge])

        const result = await processConfirmedRentPayment(context, buildPayment('150'))

        expect(result.allocations.map(allocation => ({ rentCharge: allocation.rentCharge, amount: allocation.amount }))).toEqual([
            { rentCharge: firstCharge.id, amount: '100' },
            { rentCharge: secondCharge.id, amount: '50' },
        ])
        expect(stores.RentCharge.find(charge => charge.id === firstCharge.id).status).toBe('paid')
        expect(stores.RentCharge.find(charge => charge.id === secondCharge.id).status).toBe('partially_paid')
    })

    test('marks charge partially paid after partial payment', async () => {
        const context = {}
        const charge = addRentCharge({})
        await postCharges(context, [charge])

        const result = await processConfirmedRentPayment(context, buildPayment('40'))

        expect(result.allocations.map(allocation => ({ rentCharge: allocation.rentCharge, amount: allocation.amount }))).toEqual([
            { rentCharge: charge.id, amount: '40' },
        ])
        expect(stores.RentCharge.find(item => item.id === charge.id).status).toBe('partially_paid')
    })

    test('marks charge paid after exact payment', async () => {
        const context = {}
        const charge = addRentCharge({})
        await postCharges(context, [charge])

        const result = await processConfirmedRentPayment(context, buildPayment('100'))

        expect(result.allocations.map(allocation => ({ rentCharge: allocation.rentCharge, amount: allocation.amount }))).toEqual([
            { rentCharge: charge.id, amount: '100' },
        ])
        expect(result.unallocatedAmount).toBe('0.00000000')
        expect(stores.RentCharge.find(item => item.id === charge.id).status).toBe('paid')
    })

    test('keeps overpayment as tenant credit in ledger balance', async () => {
        const context = {}
        const firstCharge = addRentCharge({ dueDate: '2026-01-01' })
        const secondCharge = addRentCharge({ dueDate: '2026-02-01' })
        await postCharges(context, [firstCharge, secondCharge])

        const result = await processConfirmedRentPayment(context, buildPayment('250'))
        const balance = await calculateLedgerBalance({ ledger: { id: result.ledger.id } })

        expect(result.unallocatedAmount).toBe('50.00000000')
        expect(balance).toBe('-50.00000000')
    })

    test('generates receipt number after payment confirmation', async () => {
        const result = await processConfirmedRentPayment({}, buildPayment('10'))

        expect(result.receipt.number).toBe('KONDO/2026/1')
        expect(result.receipt.amount).toBe('10')
        expect(result.receipt.currencyCode).toBe('GHS')
    })

    test('creates reversal entry with opposite direction', async () => {
        const context = {}
        const charge = addRentCharge({})
        const originalEntry = await postRentChargeLedgerEntry(context, charge, { sender })

        const reversal = await createReversalEntry(context, originalEntry.id, { sender })

        expect(reversal.entryType).toBe('reversal')
        expect(reversal.direction).toBe('credit')
        expect(reversal.reversesEntry).toBe(originalEntry.id)
    })

    test('creates compensating allocations and restores charge status on reversal', async () => {
        const context = {}
        const charge = addRentCharge({})
        await postCharges(context, [charge])

        await processConfirmedRentPayment(context, buildPayment('100'))
        const reversal = await reverseConfirmedRentPayment(context, buildPayment('100'))

        expect(reversal.reversalEntry.entryType).toBe('reversal')
        expect(reversal.reversalEntry.direction).toBe('debit')
        expect(reversal.allocations).toEqual([
            expect.objectContaining({
                amount: '-100',
                rentCharge: charge.id,
            }),
        ])
        expect(stores.RentCharge.find(item => item.id === charge.id).status).toBe('invoiced')
        expect(reversal.ledgerBalance).toBe('100.00000000')
    })

    test('restores pre-payment ledger balance after reversing overpayment', async () => {
        const context = {}
        const charge = addRentCharge({})
        await postCharges(context, [charge])

        await processConfirmedRentPayment(context, buildPayment('150'))
        const reversal = await reverseConfirmedRentPayment(context, buildPayment('150'))

        expect(reversal.allocations).toEqual([
            expect.objectContaining({
                amount: '-100',
                rentCharge: charge.id,
            }),
        ])
        expect(reversal.ledgerBalance).toBe('100.00000000')
    })
})
