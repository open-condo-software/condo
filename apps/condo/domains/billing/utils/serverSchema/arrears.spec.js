/**
 * @jest-environment node
 */

const mockFind = jest.fn()
const mockGetRentChargeOutstandingAmountFromAllocations = jest.fn()

jest.mock('@open-condo/keystone/schema', () => ({
    find: mockFind,
}))

jest.mock('./paymentAllocation', () => ({
    getRentChargeOutstandingAmountFromAllocations: mockGetRentChargeOutstandingAmountFromAllocations,
}))

const {
    calculateOccupancyArrears,
    calculateOrganizationArrears,
    calculatePropertyArrears,
    calculateRentalUnitArrears,
    calculateResidentArrears,
    calculateRentChargeOutstandingAmount,
} = require('./arrears')

describe('arrears helpers', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockFind.mockResolvedValue([])
        mockGetRentChargeOutstandingAmountFromAllocations.mockResolvedValue({ toFixed: () => '100.00000000' })
    })

    test('calculates unpaid charge amount from allocations', async () => {
        const amount = await calculateRentChargeOutstandingAmount({ amount: '100' })

        expect(amount.toFixed(8)).toBe('100.00000000')
        expect(mockGetRentChargeOutstandingAmountFromAllocations).toHaveBeenCalledWith({ amount: '100' })
    })

    test('uses resident scope isolation', async () => {
        mockFind.mockImplementation(async (listKey) => {
            if (listKey === 'RentCharge') return [{ amount: '100' }]
            if (listKey === 'LedgerEntry') return [{ amount: '100', direction: 'debit' }]
            return []
        })

        const result = await calculateResidentArrears('resident')

        expect(result).toEqual({ amount: '100.00000000', currencyCode: 'GHS', chargeCount: 1 })
        expect(mockFind).toHaveBeenCalledWith('RentCharge', {
            occupancy: { tenant: { id: 'resident' } },
            status_not: 'canceled',
            deletedAt: null,
        })
        expect(mockFind).toHaveBeenCalledWith('LedgerEntry', {
            tenant: { id: 'resident' },
            postingStatus: 'posted',
            deletedAt: null,
        })
    })

    test('uses occupancy, rental unit, property and organization scopes', async () => {
        mockFind.mockResolvedValue([])

        await calculateOccupancyArrears('occupancy')
        await calculateRentalUnitArrears('rental-unit')
        await calculatePropertyArrears('property')
        await calculateOrganizationArrears('organization')

        expect(mockFind).toHaveBeenNthCalledWith(1, 'RentCharge', expect.objectContaining({
            occupancy: { id: 'occupancy' },
        }))
        expect(mockFind).toHaveBeenNthCalledWith(3, 'RentCharge', expect.objectContaining({
            rentalUnit: { id: 'rental-unit' },
        }))
        expect(mockFind).toHaveBeenNthCalledWith(5, 'RentCharge', expect.objectContaining({
            property: { id: 'property' },
        }))
        expect(mockFind).toHaveBeenNthCalledWith(7, 'RentCharge', expect.objectContaining({
            organization: { id: 'organization' },
        }))
    })
})
