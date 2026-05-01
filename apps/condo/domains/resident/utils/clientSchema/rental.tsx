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
