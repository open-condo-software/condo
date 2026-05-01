/**
 * @jest-environment node
 */

const mockOccupancyCreate = jest.fn()
const mockOccupancyUpdate = jest.fn()
const mockFind = jest.fn()
const mockGetById = jest.fn()
const mockFindActiveOccupancies = jest.fn()
const mockGenerateRentChargesForOccupancy = jest.fn()
const mockCalculateOccupancyArrears = jest.fn()

jest.mock('@open-condo/codegen/generate.server.utils', () => ({
    generateServerUtils: jest.fn(() => ({
        create: mockOccupancyCreate,
        update: mockOccupancyUpdate,
    })),
}))

jest.mock('@open-condo/keystone/schema', () => ({
    find: mockFind,
    getById: mockGetById,
}))

jest.mock('@condo/domains/resident/utils/serverSchema/activeOccupancy', () => ({
    findActiveOccupancies: mockFindActiveOccupancies,
}))

jest.mock('@condo/domains/billing/utils/serverSchema/rentChargeGeneration', () => ({
    generateRentChargesForOccupancy: mockGenerateRentChargesForOccupancy,
}))

jest.mock('@condo/domains/billing/utils/serverSchema/arrears', () => ({
    calculateOccupancyArrears: mockCalculateOccupancyArrears,
}))

const {
    checkInOccupancy,
    checkOutOccupancy,
    reserveRentalUnit,
    transferOccupancy,
} = require('./occupancyLifecycle')

const context = {}
const sender = { dv: 1, fingerprint: 'test' }

function setupState ({
    rentalUnits = [],
    occupancies = [],
    billingPolicies = [{ id: 'policy', property: 'property', deletedAt: null }],
    activeOccupancies = [],
} = {}) {
    const state = {
        rentalUnits: [...rentalUnits],
        occupancies: [...occupancies],
        billingPolicies: [...billingPolicies],
    }

    mockGetById.mockImplementation(async (listKey, id) => {
        if (listKey === 'RentalUnit') return state.rentalUnits.find(item => item.id === id) || null
        if (listKey === 'Occupancy') return state.occupancies.find(item => item.id === id) || null

        return null
    })
    mockFind.mockImplementation(async (listKey, where) => {
        if (listKey === 'BillingPolicy') {
            return state.billingPolicies.filter(policy => policy.property === where.property.id && !policy.deletedAt)
        }

        return []
    })
    mockFindActiveOccupancies.mockImplementation(async ({ tenantId, rentalUnitId }) => {
        return activeOccupancies.filter(occupancy => (
            (!tenantId || occupancy.tenant === tenantId) &&
            (!rentalUnitId || occupancy.rentalUnit === rentalUnitId)
        ))
    })
    mockOccupancyCreate.mockImplementation(async (ctx, data) => {
        const occupancy = {
            id: `occupancy-${state.occupancies.length + 1}`,
            organization: data.organization.connect.id,
            tenant: data.tenant.connect.id,
            property: data.property.connect.id,
            rentalUnit: data.rentalUnit.connect.id,
            startDate: data.startDate,
            expectedEndDate: data.expectedEndDate,
            actualEndDate: data.actualEndDate,
            billingFrequency: data.billingFrequency,
            monthlyRate: data.monthlyRate,
            status: data.status,
        }
        state.occupancies.push(occupancy)

        return occupancy
    })
    mockOccupancyUpdate.mockImplementation(async (ctx, id, data) => {
        const index = state.occupancies.findIndex(item => item.id === id)
        state.occupancies[index] = {
            ...state.occupancies[index],
            ...data,
        }

        return state.occupancies[index]
    })
    mockGenerateRentChargesForOccupancy.mockResolvedValue({ createdCount: 1, invoice: { id: 'invoice' } })
    mockCalculateOccupancyArrears.mockResolvedValue({ amount: '100.00000000', currencyCode: 'RUB', chargeCount: 1 })

    return state
}

describe('occupancyLifecycle', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('reservation creates planned scoped occupancy', async () => {
        setupState({
            rentalUnits: [{ id: 'unit', organization: 'organization', property: 'property', rentable: true, capacity: 1 }],
        })

        const occupancy = await reserveRentalUnit(context, {
            dv: 1,
            sender,
            organizationId: 'organization',
            propertyId: 'property',
            tenantId: 'tenant',
            rentalUnitId: 'unit',
            startDate: '2026-01-10',
            monthlyRate: '100',
        })

        expect(occupancy).toEqual(expect.objectContaining({
            status: 'planned',
            tenant: 'tenant',
            rentalUnit: 'unit',
            property: 'property',
            organization: 'organization',
        }))
        expect(mockOccupancyCreate).toHaveBeenCalledWith(context, expect.objectContaining({
            status: 'planned',
            rentalUnit: { connect: { id: 'unit' } },
        }))
    })

    test('check-in activates planned occupancy and generates initial charge', async () => {
        setupState({
            rentalUnits: [{ id: 'unit', organization: 'organization', property: 'property', rentable: true, capacity: 1 }],
            occupancies: [{
                id: 'occupancy',
                organization: 'organization',
                tenant: 'tenant',
                property: 'property',
                rentalUnit: 'unit',
                startDate: '2026-01-10',
                monthlyRate: '100',
                billingFrequency: 'monthly',
                status: 'planned',
            }],
        })

        const result = await checkInOccupancy(context, {
            dv: 1,
            sender,
            occupancyId: 'occupancy',
            startDate: '2026-01-10',
        })

        expect(result.occupancy.status).toBe('active')
        expect(result.rentChargeGeneration).toEqual({ createdCount: 1, invoiceId: 'invoice' })
        expect(mockGenerateRentChargesForOccupancy).toHaveBeenCalledWith(context, expect.objectContaining({
            id: 'occupancy',
            status: 'active',
        }), expect.objectContaining({
            cutoffDate: '2026-01-10',
        }))
    })

    test('check-in fails when rental unit capacity is exceeded', async () => {
        setupState({
            rentalUnits: [{ id: 'unit', organization: 'organization', property: 'property', rentable: true, capacity: 1 }],
            activeOccupancies: [{ id: 'existing', tenant: 'other-tenant', rentalUnit: 'unit' }],
        })

        await expect(checkInOccupancy(context, {
            dv: 1,
            sender,
            tenantId: 'tenant',
            rentalUnitId: 'unit',
            startDate: '2026-01-10',
        })).rejects.toThrow('Rental unit active occupancy capacity is exceeded')
    })

    test('check-in fails without BillingPolicy', async () => {
        setupState({
            rentalUnits: [{ id: 'unit', organization: 'organization', property: 'property', rentable: true, capacity: 1 }],
            billingPolicies: [],
        })

        await expect(checkInOccupancy(context, {
            dv: 1,
            sender,
            tenantId: 'tenant',
            rentalUnitId: 'unit',
            startDate: '2026-01-10',
        })).rejects.toThrow('Billing policy must exist before activating occupancy')
    })

    test('check-out sets actualEndDate, creates final charges and returns arrears', async () => {
        setupState({
            occupancies: [{
                id: 'occupancy',
                organization: 'organization',
                tenant: 'tenant',
                property: 'property',
                rentalUnit: 'unit',
                startDate: '2026-01-10',
                monthlyRate: '100',
                billingFrequency: 'monthly',
                status: 'active',
            }],
        })

        const result = await checkOutOccupancy(context, {
            dv: 1,
            sender,
            occupancyId: 'occupancy',
            actualEndDate: '2026-02-15',
        })

        expect(result.occupancy).toEqual(expect.objectContaining({
            status: 'ended',
            actualEndDate: '2026-02-15',
        }))
        expect(mockGenerateRentChargesForOccupancy).toHaveBeenCalledWith(context, expect.objectContaining({
            actualEndDate: '2026-02-15',
        }), expect.objectContaining({
            cutoffDate: '2026-02-15',
            includeCutoffMonth: true,
        }))
        expect(result.arrears).toEqual({ amount: '100.00000000', currencyCode: 'RUB', chargeCount: 1 })
    })

    test('transfer closes previous occupancy and creates new target-unit occupancy', async () => {
        const state = setupState({
            rentalUnits: [
                { id: 'unit-1', organization: 'organization', property: 'property', rentable: true, capacity: 1 },
                { id: 'unit-2', organization: 'organization', property: 'property', rentable: true, capacity: 1 },
            ],
            occupancies: [{
                id: 'occupancy',
                organization: 'organization',
                tenant: 'tenant',
                property: 'property',
                rentalUnit: 'unit-1',
                startDate: '2026-01-10',
                expectedEndDate: '2026-12-31',
                monthlyRate: '100',
                billingFrequency: 'monthly',
                status: 'active',
            }],
        })

        const result = await transferOccupancy(context, {
            dv: 1,
            sender,
            occupancyId: 'occupancy',
            targetRentalUnitId: 'unit-2',
            transferDate: '2026-03-01',
        })

        expect(result.previousOccupancy).toEqual(expect.objectContaining({
            id: 'occupancy',
            status: 'ended',
            actualEndDate: '2026-02-28',
        }))
        expect(result.newOccupancy).toEqual(expect.objectContaining({
            tenant: 'tenant',
            rentalUnit: 'unit-2',
            startDate: '2026-03-01',
            status: 'active',
        }))
        expect(state.occupancies).toHaveLength(2)
    })

    test('tenant history is preserved during transfer', async () => {
        const state = setupState({
            rentalUnits: [
                { id: 'unit-1', organization: 'organization', property: 'property', rentable: true, capacity: 1 },
                { id: 'unit-2', organization: 'organization', property: 'property', rentable: true, capacity: 1 },
            ],
            occupancies: [{
                id: 'occupancy',
                organization: 'organization',
                tenant: 'tenant',
                property: 'property',
                rentalUnit: 'unit-1',
                startDate: '2026-01-10',
                monthlyRate: '100',
                billingFrequency: 'monthly',
                status: 'active',
            }],
        })

        await transferOccupancy(context, {
            dv: 1,
            sender,
            occupancyId: 'occupancy',
            targetRentalUnitId: 'unit-2',
            transferDate: '2026-03-01',
        })

        expect(state.occupancies.map(occupancy => ({
            tenant: occupancy.tenant,
            rentalUnit: occupancy.rentalUnit,
            status: occupancy.status,
        }))).toEqual([
            { tenant: 'tenant', rentalUnit: 'unit-1', status: 'ended' },
            { tenant: 'tenant', rentalUnit: 'unit-2', status: 'active' },
        ])
    })

    test('scope isolation rejects mismatched organization/property/rentalUnit', async () => {
        setupState({
            rentalUnits: [{ id: 'unit', organization: 'organization', property: 'property', rentable: true, capacity: 1 }],
        })

        await expect(reserveRentalUnit(context, {
            dv: 1,
            sender,
            organizationId: 'other-organization',
            propertyId: 'property',
            tenantId: 'tenant',
            rentalUnitId: 'unit',
            startDate: '2026-01-10',
        })).rejects.toThrow('Occupancy organization, property and rental unit must match')
    })
})
