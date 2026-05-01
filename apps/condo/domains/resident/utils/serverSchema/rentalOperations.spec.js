/**
 * @jest-environment node
 */

const mockFind = jest.fn()
const mockGetById = jest.fn()
const mockCalculateOrganizationArrears = jest.fn()
const mockCalculateRentChargeOutstandingAmount = jest.fn()
const mockCalculateResidentArrears = jest.fn()

const Big = require('big.js')

jest.mock('@open-condo/keystone/schema', () => ({
    find: mockFind,
    getById: mockGetById,
}))

jest.mock('@condo/domains/billing/utils/serverSchema/arrears', () => ({
    calculateOrganizationArrears: mockCalculateOrganizationArrears,
    calculateRentChargeOutstandingAmount: mockCalculateRentChargeOutstandingAmount,
    calculateResidentArrears: mockCalculateResidentArrears,
}))

const {
    findAvailableHostelBeds,
    findAvailableRentalUnits,
    findResidentsWithArrears,
    getOrganizationRentArrearsSummary,
    getPropertyOccupancySummary,
    getResidentCurrentOccupancySummary,
} = require('./rentalOperations')

function setupState ({
    rentalUnits = [],
    occupancies = [],
    rentCharges = [],
    residents = [],
    invoices = [],
} = {}) {
    mockFind.mockImplementation(async (listKey, where) => {
        if (listKey === 'RentalUnit') {
            return rentalUnits.filter(unit => (
                unit.deletedAt === null &&
                (!where.rentable || unit.rentable === where.rentable) &&
                (!where.organization || unit.organization === where.organization.id) &&
                (!where.property || unit.property === where.property.id) &&
                (!where.unitType || unit.unitType === where.unitType) &&
                (!where.unitType_in || where.unitType_in.includes(unit.unitType))
            ))
        }

        if (listKey === 'Occupancy') {
            return occupancies.filter(occupancy => {
                if (where.id_in && !where.id_in.includes(occupancy.id)) return false
                if (where.status && occupancy.status !== where.status) return false
                if (where.status_in && !where.status_in.includes(occupancy.status)) return false
                if (where.startDate_lte && occupancy.startDate > where.startDate_lte) return false
                if (where.actualEndDate === null && occupancy.actualEndDate) return false
                if (where.expectedEndDate_gte && occupancy.expectedEndDate < where.expectedEndDate_gte) return false
                if (where.expectedEndDate_lte && occupancy.expectedEndDate > where.expectedEndDate_lte) return false
                if (where.organization && occupancy.organization !== where.organization.id) return false
                if (where.property && occupancy.property !== where.property.id) return false
                if (where.rentalUnit && where.rentalUnit.id_in && !where.rentalUnit.id_in.includes(occupancy.rentalUnit)) return false
                if (where.rentalUnit && where.rentalUnit.id && occupancy.rentalUnit !== where.rentalUnit.id) return false
                if (where.tenant && where.tenant.id && occupancy.tenant !== where.tenant.id) return false
                if (where.deletedAt === null && occupancy.deletedAt) return false

                return true
            })
        }

        if (listKey === 'RentCharge') {
            return rentCharges.filter(rentCharge => (
                (!where.organization || rentCharge.organization === where.organization.id) &&
                (!where.property || rentCharge.property === where.property.id) &&
                (!where.occupancy || rentCharge.occupancy === where.occupancy.id) &&
                (!where.status_not || rentCharge.status !== where.status_not) &&
                (!where.deletedAt || rentCharge.deletedAt === null)
            ))
        }

        return []
    })
    mockGetById.mockImplementation(async (listKey, id) => {
        if (listKey === 'Invoice') return invoices.find(invoice => invoice.id === id) || null
        if (listKey === 'Resident') return residents.find(resident => resident.id === id) || null
        if (listKey === 'RentalUnit') return rentalUnits.find(rentalUnit => rentalUnit.id === id) || null
        if (listKey === 'Property') return { id }

        return null
    })
    mockCalculateRentChargeOutstandingAmount.mockImplementation(async rentCharge => Big(rentCharge.outstanding || 0))
    mockCalculateResidentArrears.mockResolvedValue({
        amount: '100.00000000',
        currencyCode: 'RUB',
        chargeCount: 1,
    })
    mockCalculateOrganizationArrears.mockResolvedValue({
        amount: '250.00000000',
        currencyCode: 'RUB',
        chargeCount: 2,
    })
}

describe('rentalOperations', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('finds available apartment unit', async () => {
        setupState({
            rentalUnits: [{
                id: 'unit',
                organization: 'organization',
                property: 'property',
                unitType: 'apartment',
                rentable: true,
                capacity: 1,
                deletedAt: null,
            }],
        })

        const result = await findAvailableRentalUnits({
            organizationId: 'organization',
            propertyId: 'property',
            startDate: '2026-01-01',
        })

        expect(result).toEqual([expect.objectContaining({
            capacity: 1,
            occupiedCount: 0,
            availableCapacity: 1,
            rentalUnit: expect.objectContaining({ id: 'unit' }),
        })])
    })

    test('finds available hostel bed', async () => {
        setupState({
            rentalUnits: [{
                id: 'bed',
                organization: 'organization',
                property: 'property',
                unitType: 'bed',
                rentable: true,
                capacity: 1,
                deletedAt: null,
            }],
        })

        const result = await findAvailableHostelBeds({
            organizationId: 'organization',
            propertyId: 'property',
            startDate: '2026-01-01',
        })

        expect(result).toHaveLength(1)
        expect(result[0].rentalUnit.id).toBe('bed')
    })

    test('excludes full room capacity from availability', async () => {
        setupState({
            rentalUnits: [{
                id: 'room',
                organization: 'organization',
                property: 'property',
                unitType: 'room',
                rentable: true,
                capacity: 2,
                deletedAt: null,
            }],
            occupancies: [
                { id: 'first', organization: 'organization', property: 'property', rentalUnit: 'room', status: 'active', startDate: '2026-01-01', deletedAt: null },
                { id: 'second', organization: 'organization', property: 'property', rentalUnit: 'room', status: 'active', startDate: '2026-01-01', deletedAt: null },
            ],
        })

        const result = await findAvailableRentalUnits({
            organizationId: 'organization',
            propertyId: 'property',
            startDate: '2026-02-01',
        })

        expect(result).toEqual([])
    })

    test('excludes reserved planned unit from availability', async () => {
        setupState({
            rentalUnits: [{
                id: 'unit',
                organization: 'organization',
                property: 'property',
                unitType: 'apartment',
                rentable: true,
                capacity: 1,
                deletedAt: null,
            }],
            occupancies: [{
                id: 'reserved',
                organization: 'organization',
                property: 'property',
                rentalUnit: 'unit',
                status: 'planned',
                startDate: '2026-03-01',
                expectedEndDate: '2026-03-31',
                deletedAt: null,
            }],
        })

        const result = await findAvailableRentalUnits({
            organizationId: 'organization',
            propertyId: 'property',
            startDate: '2026-03-10',
            expectedEndDate: '2026-03-20',
        })

        expect(result).toEqual([])
    })

    test('builds resident dashboard summary', async () => {
        setupState({
            occupancies: [{
                id: 'occupancy',
                organization: 'organization',
                property: 'property',
                tenant: 'resident',
                rentalUnit: { id: 'unit', name: '101' },
                status: 'active',
                startDate: '2026-01-01',
                billingFrequency: 'monthly',
                monthlyRate: '100',
                deletedAt: null,
            }],
            rentCharges: [{
                id: 'charge',
                occupancy: 'occupancy',
                organization: 'organization',
                property: 'property',
                dueDate: '2026-02-01',
                amount: '100',
                outstanding: '40',
                invoice: 'invoice',
                status: 'invoiced',
                deletedAt: null,
            }],
            invoices: [{ id: 'invoice', status: 'published' }],
        })

        const result = await getResidentCurrentOccupancySummary('resident', { today: '2026-01-15' })

        expect(result).toEqual(expect.objectContaining({
            currentRentalUnit: { id: 'unit', name: '101' },
            occupancyStatus: 'active',
            billingFrequency: 'monthly',
            monthlyRate: '100',
            arrearsTotal: '40.00000000',
            nextDueDate: '2026-02-01',
        }))
        expect(result.unpaidRentCharges).toHaveLength(1)
        expect(result.linkedUnpaidInvoices).toEqual([{ id: 'invoice', status: 'published' }])
    })

    test('builds property occupancy summary', async () => {
        setupState({
            rentalUnits: [
                { id: 'first', organization: 'organization', property: 'property', rentable: true, capacity: 1, deletedAt: null },
                { id: 'second', organization: 'organization', property: 'property', rentable: true, capacity: 2, deletedAt: null },
            ],
            occupancies: [{
                id: 'occupancy',
                organization: 'organization',
                property: 'property',
                rentalUnit: 'second',
                status: 'active',
                startDate: '2026-01-01',
                deletedAt: null,
            }],
        })

        const result = await getPropertyOccupancySummary({
            organizationId: 'organization',
            propertyId: 'property',
            today: '2026-02-01',
        })

        expect(result).toEqual({
            totalRentableUnits: 2,
            occupiedUnits: 1,
            availableUnits: 2,
            totalCapacity: 3,
            occupiedCapacity: 1,
            availableCapacity: 2,
        })
    })

    test('finds residents with arrears', async () => {
        setupState({
            residents: [{ id: 'resident' }],
            occupancies: [{
                id: 'occupancy',
                organization: 'organization',
                property: 'property',
                tenant: 'resident',
                rentalUnit: 'unit',
                status: 'active',
                startDate: '2026-01-01',
                deletedAt: null,
            }],
            rentCharges: [{
                id: 'charge',
                occupancy: 'occupancy',
                organization: 'organization',
                property: 'property',
                amount: '100',
                outstanding: '100',
                status: 'draft',
                deletedAt: null,
            }],
        })

        const result = await findResidentsWithArrears({
            organizationId: 'organization',
            propertyId: 'property',
        })

        expect(result).toEqual([{
            resident: { id: 'resident' },
            currentOccupancy: expect.objectContaining({ id: 'occupancy' }),
            arrearsTotal: '100.00000000',
            currencyCode: 'RUB',
            chargeCount: 1,
        }])
    })

    test('keeps property and organization scopes isolated', async () => {
        setupState({
            rentalUnits: [
                { id: 'own', organization: 'organization', property: 'property', rentable: true, capacity: 1, deletedAt: null },
                { id: 'other', organization: 'other-organization', property: 'other-property', rentable: true, capacity: 1, deletedAt: null },
            ],
            rentCharges: [
                { id: 'own-charge', organization: 'organization', property: 'property', occupancy: 'own-occupancy', amount: '100', outstanding: '100', status: 'draft', deletedAt: null },
                { id: 'other-charge', organization: 'other-organization', property: 'other-property', occupancy: 'other-occupancy', amount: '500', outstanding: '500', status: 'draft', deletedAt: null },
            ],
        })

        const availableUnits = await findAvailableRentalUnits({
            organizationId: 'organization',
            propertyId: 'property',
            startDate: '2026-01-01',
        })
        const summary = await getOrganizationRentArrearsSummary('organization')

        expect(availableUnits.map(item => item.rentalUnit.id)).toEqual(['own'])
        expect(summary).toEqual({
            rentChargedTotal: '100.00000000',
            arrearsTotal: '250.00000000',
            currencyCode: 'RUB',
            residentsWithArrearsCount: 0,
        })
    })
})
