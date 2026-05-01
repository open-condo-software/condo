/**
 * @jest-environment node
 */

const mockFind = jest.fn()
const mockGetById = jest.fn()

jest.mock('@open-condo/keystone/schema', () => ({
    find: mockFind,
    getById: mockGetById,
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
    })

    test('calculates unpaid charge amount', async () => {
        const amount = await calculateRentChargeOutstandingAmount({ amount: '100' })

        expect(amount.toFixed(8)).toBe('100.00000000')
    })

    test('returns zero for paid linked invoice', async () => {
        mockGetById.mockResolvedValue({ id: 'invoice', status: 'paid' })

        const amount = await calculateRentChargeOutstandingAmount({ amount: '100', invoice: 'invoice' })

        expect(amount.toFixed(8)).toBe('0.00000000')
    })

    test('subtracts successful invoice payments for partially paid invoice', async () => {
        mockGetById.mockResolvedValue({ id: 'invoice', status: 'published' })
        mockFind.mockResolvedValue([{ amount: '25' }])

        const amount = await calculateRentChargeOutstandingAmount({ amount: '100', invoice: 'invoice' })

        expect(amount.toFixed(8)).toBe('75.00000000')
        expect(mockFind).toHaveBeenCalledWith('Payment', expect.objectContaining({
            invoice: { id: 'invoice' },
            status_in: ['DONE', 'WITHDRAWN'],
            deletedAt: null,
        }))
    })

    test('calculates from linked billing receipt balance', async () => {
        mockGetById.mockResolvedValue({ id: 'receipt', toPay: '100', paid: '40' })

        const amount = await calculateRentChargeOutstandingAmount({ amount: '100', billingReceipt: 'receipt' })

        expect(amount.toFixed(8)).toBe('60.00000000')
    })

    test('uses resident scope isolation', async () => {
        mockFind.mockResolvedValue([{ amount: '100' }])

        const result = await calculateResidentArrears('resident')

        expect(result).toEqual({ amount: '100.00000000', currencyCode: 'RUB', chargeCount: 1 })
        expect(mockFind).toHaveBeenCalledWith('RentCharge', {
            occupancy: { tenant: { id: 'resident' } },
            status_not: 'canceled',
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
        expect(mockFind).toHaveBeenNthCalledWith(2, 'RentCharge', expect.objectContaining({
            rentalUnit: { id: 'rental-unit' },
        }))
        expect(mockFind).toHaveBeenNthCalledWith(3, 'RentCharge', expect.objectContaining({
            property: { id: 'property' },
        }))
        expect(mockFind).toHaveBeenNthCalledWith(4, 'RentCharge', expect.objectContaining({
            organization: { id: 'organization' },
        }))
    })
})
