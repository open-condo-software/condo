/**
 * @jest-environment node
 */

const mockRentChargeCreate = jest.fn()
const mockRentChargeUpdate = jest.fn()
const mockInvoiceCreate = jest.fn()
const mockFind = jest.fn()
const mockFindActiveOccupancies = jest.fn()

jest.mock('@open-condo/codegen/generate.server.utils', () => ({
    generateServerUtils: jest.fn(() => ({
        create: mockRentChargeCreate,
        update: mockRentChargeUpdate,
    })),
}))

jest.mock('@open-condo/keystone/schema', () => ({
    find: mockFind,
    getSchemaCtx: jest.fn(() => ({ keystone: {} })),
}))

jest.mock('@condo/domains/marketplace/utils/serverSchema', () => ({
    Invoice: {
        create: mockInvoiceCreate,
    },
}))

jest.mock('@condo/domains/resident/utils/serverSchema', () => ({
    findActiveOccupancies: mockFindActiveOccupancies,
}))

const {
    generateRentCharges,
    generateRentChargesForOccupancy,
} = require('./rentChargeGeneration')

const organizationId = 'organization'
const propertyId = 'property'
const rentalUnitId = 'rental-unit'
const occupancy = {
    id: 'occupancy',
    organization: organizationId,
    property: propertyId,
    rentalUnit: rentalUnitId,
    startDate: '2026-01-10',
    monthlyRate: '100',
    billingFrequency: 'monthly',
}

function setupFind ({ policies = [], charges = [] } = {}) {
    mockFind.mockImplementation(async (listKey, where) => {
        if (listKey === 'BillingPolicy') return policies

        if (listKey === 'RentCharge') {
            if (where.invoice_is_null) {
                return charges.filter(charge => !charge.invoice && charge.status === where.status && charge.dueDate <= where.dueDate_lte)
            }

            return charges.filter(charge => (
                charge.occupancy === where.occupancy.id &&
                charge.billingMonth === where.billingMonth &&
                !charge.deletedAt
            ))
        }

        return []
    })
}

describe('rentChargeGeneration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('monthly charge generation creates one due charge with period fields', async () => {
        const charges = []
        setupFind({
            policies: [{ property: propertyId, dueDay: 1, partialMonthRule: 'full', billingCycle: 'monthly' }],
            charges,
        })
        mockRentChargeCreate.mockImplementation(async (context, data) => {
            const charge = {
                id: `charge-${charges.length + 1}`,
                occupancy: data.occupancy.connect.id,
                property: data.property.connect.id,
                rentalUnit: data.rentalUnit.connect.id,
                status: 'draft',
                ...data,
            }
            charges.push(charge)
            return charge
        })

        const result = await generateRentChargesForOccupancy({}, occupancy, { cutoffDate: '2026-01-01' })

        expect(result.createdCount).toBe(1)
        expect(mockRentChargeCreate).toHaveBeenCalledWith({}, expect.objectContaining({
            billingMonth: '2026-01-01',
            periodStart: '2026-01-01',
            periodEnd: '2026-01-31',
            dueDate: '2026-01-01',
            amount: '100',
            currencyCode: 'RUB',
        }))
    })

    test('re-running generation does not duplicate charges', async () => {
        const charges = [{
            id: 'charge-1',
            occupancy: occupancy.id,
            billingMonth: '2026-01-01',
            dueDate: '2026-01-01',
            status: 'draft',
        }]
        setupFind({
            policies: [{ property: propertyId, dueDay: 1, partialMonthRule: 'full', billingCycle: 'monthly' }],
            charges,
        })

        const result = await generateRentChargesForOccupancy({}, occupancy, { cutoffDate: '2026-01-01' })

        expect(result.createdCount).toBe(0)
        expect(mockRentChargeCreate).not.toHaveBeenCalled()
    })

    test('annual billing creates monthly charges and a grouped invoice', async () => {
        const charges = []
        const annualOccupancy = { ...occupancy, billingFrequency: 'annual' }
        setupFind({
            policies: [{ property: propertyId, dueDay: 1, partialMonthRule: 'full', billingCycle: 'annual' }],
            charges,
        })
        mockRentChargeCreate.mockImplementation(async (context, data) => {
            const charge = {
                id: `charge-${charges.length + 1}`,
                occupancy: data.occupancy.connect.id,
                property: data.property.connect.id,
                rentalUnit: data.rentalUnit.connect.id,
                billingMonth: data.billingMonth,
                dueDate: data.dueDate,
                amount: data.amount,
                status: 'draft',
            }
            charges.push(charge)
            return charge
        })
        mockInvoiceCreate.mockResolvedValue({ id: 'invoice-1' })
        mockRentChargeUpdate.mockImplementation(async (context, id, data) => {
            const charge = charges.find(charge => charge.id === id)
            if (charge) {
                charge.invoice = data.invoice.connect.id
                charge.status = data.status
            }

            return charge
        })

        const result = await generateRentChargesForOccupancy({}, annualOccupancy, { cutoffDate: '2026-03-01' })

        expect(result.createdCount).toBe(3)
        expect(mockInvoiceCreate).toHaveBeenCalledWith({}, expect.objectContaining({
            rows: [
                { name: 'Rent 2026-01-01', toPay: '100', count: 1 },
                { name: 'Rent 2026-02-01', toPay: '100', count: 1 },
                { name: 'Rent 2026-03-01', toPay: '100', count: 1 },
            ],
        }))
        expect(mockRentChargeUpdate).toHaveBeenCalledTimes(3)
        expect(mockRentChargeUpdate).toHaveBeenNthCalledWith(1, {}, 'charge-1', expect.objectContaining({
            invoice: { connect: { id: 'invoice-1' } },
            status: 'invoiced',
        }))
        expect(mockRentChargeUpdate).toHaveBeenNthCalledWith(2, {}, 'charge-2', expect.objectContaining({
            invoice: { connect: { id: 'invoice-1' } },
            status: 'invoiced',
        }))
        expect(mockRentChargeUpdate).toHaveBeenNthCalledWith(3, {}, 'charge-3', expect.objectContaining({
            invoice: { connect: { id: 'invoice-1' } },
            status: 'invoiced',
        }))
        expect(charges.map(charge => ({
            id: charge.id,
            billingMonth: charge.billingMonth,
            invoice: charge.invoice,
            status: charge.status,
        }))).toEqual([
            { id: 'charge-1', billingMonth: '2026-01-01', invoice: 'invoice-1', status: 'invoiced' },
            { id: 'charge-2', billingMonth: '2026-02-01', invoice: 'invoice-1', status: 'invoiced' },
            { id: 'charge-3', billingMonth: '2026-03-01', invoice: 'invoice-1', status: 'invoiced' },
        ])
    })

    test('inactive occupancies are ignored by batch generation', async () => {
        mockFindActiveOccupancies.mockResolvedValue([])

        const result = await generateRentCharges({ context: {}, cutoffDate: '2026-01-01' })

        expect(result.processedOccupancies).toBe(0)
        expect(result.createdCharges).toBe(0)
        expect(mockFindActiveOccupancies).toHaveBeenCalledWith({ today: '2026-01-01' })
    })

    test('future occupancies are ignored until active', async () => {
        mockFindActiveOccupancies.mockResolvedValue([])

        const result = await generateRentCharges({ context: {}, cutoffDate: '2026-01-01' })

        expect(result.results).toEqual([])
        expect(mockRentChargeCreate).not.toHaveBeenCalled()
    })
})
