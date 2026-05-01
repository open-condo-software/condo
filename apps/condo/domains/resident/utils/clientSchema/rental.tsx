import get from 'lodash/get'

import type { IntlShape } from 'react-intl'


type RentalUnitLike = {
    name?: string | null
    unitType?: string | null
}

type LegacyUnitLike = {
    unitName?: string | null
    unitType?: string | null
    rentalUnit?: RentalUnitLike | null
}

type ResidentRentalDashboardLike = {
    currentRentalUnit?: RentalUnitLike | null
    occupancyStatus?: string | null
    billingFrequency?: string | null
    monthlyRate?: string | null
    arrearsTotal?: string | null
    nextDueDate?: string | null
    unpaidRentCharges?: unknown[] | null
    linkedUnpaidInvoices?: unknown[] | null
}

export function getRentalUnitDisplayName (intl: IntlShape, rentalUnit?: RentalUnitLike | null, fallback?: LegacyUnitLike | null): string {
    const name = get(rentalUnit, 'name') || get(fallback, 'unitName')
    const unitType = get(rentalUnit, 'unitType') || get(fallback, 'unitType')

    if (!name) return ''

    if (!unitType) return name

    try {
        const prefix = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.prefix.${unitType}` as FormatjsIntl.Message['ids'] })
        return prefix ? `${prefix} ${name}` : name
    } catch (error) {
        return name
    }
}

export function getRecordRentalUnitDisplayName (intl: IntlShape, record?: LegacyUnitLike | null): string {
    return getRentalUnitDisplayName(intl, get(record, 'rentalUnit'), record)
}

export function getRecordRentalUnitType (record?: LegacyUnitLike | null): string | null {
    return get(record, ['rentalUnit', 'unitType']) || get(record, 'unitType') || null
}

export function buildRentalUnitSelectWhere ({ propertyId, organizationId, rentableOnly }: {
    propertyId?: string | null
    organizationId?: string | null
    rentableOnly?: boolean
} = {}) {
    return {
        deletedAt: null,
        ...(propertyId ? { property: { id: propertyId } } : {}),
        ...(organizationId ? { organization: { id: organizationId } } : {}),
        ...(rentableOnly ? { rentable: true } : {}),
    }
}

export function buildResidentRentalDashboardDataSource (intl: IntlShape, dashboard?: ResidentRentalDashboardLike | null) {
    if (!dashboard) return []

    return [
        { label: 'Rental unit', value: getRentalUnitDisplayName(intl, get(dashboard, 'currentRentalUnit')) || '—' },
        { label: 'Occupancy status', value: get(dashboard, 'occupancyStatus') || '—' },
        { label: 'Billing frequency', value: get(dashboard, 'billingFrequency') || '—' },
        { label: 'Monthly rate', value: get(dashboard, 'monthlyRate') || '—' },
        { label: 'Arrears', value: get(dashboard, 'arrearsTotal') || '0' },
        { label: 'Next due date', value: get(dashboard, 'nextDueDate') || '—' },
        { label: 'Unpaid rent charges', value: get(dashboard, 'unpaidRentCharges', []).length },
        { label: 'Linked unpaid invoices', value: get(dashboard, 'linkedUnpaidInvoices', []).length },
    ]
}
