import { ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'

import type { FiltersFromQueryType } from '@condo/domains/common/utils/tables.utils'


type PaymentFilterKeyByView = Record<ViewTypes, string>

const COMMON_PAYMENT_FILTER_KEYS: PaymentFilterKeyByView[] = [
    { list: 'depositedDate', registry: 'paymentPeriod' },
    { list: 'transferDate', registry: 'loadedAt' },
    { list: 'order', registry: 'paymentOrder' },
    { list: 'type', registry: 'type' },
]

const PAYMENT_COLUMN_FILTER_KEYS: Record<ViewTypes, string[]> = {
    list: ['depositedDate', 'transferDate', 'accountNumber', 'address', 'type', 'order', 'status'],
    registry: ['paymentPeriod', 'loadedAt', 'paymentOrder', 'type', 'status'],
}

const PAYMENT_ORDER_FILTER_KEYS = new Set(['order', 'paymentOrder'])

const normalizeFilterValue = (key: string, value: FiltersFromQueryType[string]): FiltersFromQueryType[string] => {
    if (PAYMENT_ORDER_FILTER_KEYS.has(key) && Array.isArray(value)) return value[0] || ''

    return value
}

const hasFilterValue = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.length > 0

    return value !== undefined && value !== null && value !== ''
}

export const getPaymentColumnFilterState = (
    filters: FiltersFromQueryType,
    type: ViewTypes
): FiltersFromQueryType => {
    return PAYMENT_COLUMN_FILTER_KEYS[type].reduce((result, key) => {
        const value = normalizeFilterValue(key, filters[key])
        if (hasFilterValue(value)) {
            result[key] = value
        }

        return result
    }, {} as FiltersFromQueryType)
}

export const mergePaymentColumnFilters = (
    filters: FiltersFromQueryType,
    columnFilters: FiltersFromQueryType,
    type: ViewTypes
): FiltersFromQueryType => {
    const result = { ...filters }

    PAYMENT_COLUMN_FILTER_KEYS[type].forEach(key => {
        delete result[key]
    })

    Object.entries(columnFilters).forEach(([key, value]) => {
        const normalizedValue = normalizeFilterValue(key, value)
        if (hasFilterValue(normalizedValue)) {
            result[key] = normalizedValue
        }
    })

    return result
}

export const getTransferredPaymentFilters = (
    filters: FiltersFromQueryType,
    currentType: ViewTypes,
    nextType: ViewTypes
): FiltersFromQueryType => {
    if (currentType === nextType) return filters

    const transferredFilters: FiltersFromQueryType = {}
    if (filters.search) {
        transferredFilters.search = filters.search
    }

    COMMON_PAYMENT_FILTER_KEYS.forEach((filterKeys) => {
        const currentKey = filterKeys[currentType]
        const value = normalizeFilterValue(currentKey, filters[currentKey])
        if (value) {
            transferredFilters[filterKeys[nextType]] = value
        }
    })

    return transferredFilters
}
