import {
    buildRentalUnitSelectWhere,
    buildResidentRentalDashboardDataSource,
    getRentalUnitDisplayName,
} from './rental'


const intl = {
    formatMessage: ({ id }) => {
        if (id === 'pages.condo.ticket.field.unitType.prefix.room') return 'Room'
        if (id === 'pages.condo.ticket.field.unitType.prefix.apartment') return ''

        return id
    },
} as never

describe('rental client helpers', () => {
    test('prefers rental unit display data over legacy resident fallback', () => {
        expect(getRentalUnitDisplayName(
            intl,
            { name: '204', unitType: 'room' },
            { unitName: 'legacy', unitType: 'apartment' }
        )).toBe('Room 204')
    })

    test('uses unitName and unitType only as deprecated display fallback', () => {
        expect(getRentalUnitDisplayName(
            intl,
            null,
            { unitName: '17', unitType: 'room' }
        )).toBe('Room 17')
    })

    test('builds RentalUnitSelect query scope with rentable filter', () => {
        expect(buildRentalUnitSelectWhere({
            propertyId: 'property',
            organizationId: 'organization',
            rentableOnly: true,
        })).toEqual({
            deletedAt: null,
            property: { id: 'property' },
            organization: { id: 'organization' },
            rentable: true,
        })
    })

    test('builds resident dashboard rows from rental-unit and rent-charge summary data', () => {
        const rows = buildResidentRentalDashboardDataSource(intl, {
            currentRentalUnit: { name: '301', unitType: 'room' },
            occupancyStatus: 'active',
            billingFrequency: 'annual',
            monthlyRate: '100.00000000',
            arrearsTotal: '25.00000000',
            nextDueDate: '2026-05-01',
            unpaidRentCharges: [{ id: 'charge-1' }, { id: 'charge-2' }],
            linkedUnpaidInvoices: [{ id: 'invoice-1' }],
        })

        expect(rows).toEqual([
            { label: 'Rental unit', value: 'Room 301' },
            { label: 'Occupancy status', value: 'active' },
            { label: 'Billing frequency', value: 'annual' },
            { label: 'Monthly rate', value: '100.00000000' },
            { label: 'Arrears', value: '25.00000000' },
            { label: 'Next due date', value: '2026-05-01' },
            { label: 'Unpaid rent charges', value: 2 },
            { label: 'Linked unpaid invoices', value: 1 },
        ])
    })
})
