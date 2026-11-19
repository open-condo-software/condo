import { ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'

import type { FiltersFromQueryType } from '@condo/domains/common/utils/tables.utils'


type PaymentFilterKeyByView = Record<ViewTypes, string>

type CommonPaymentField = PaymentFilterKeyByView & {
    filter?: boolean
    sortable?: boolean
}

const PAYMENT_DATE_FIELD: PaymentFilterKeyByView = { list: 'depositedDate', registry: 'paymentPeriod' }

const COMMON_PAYMENT_FIELDS: CommonPaymentField[] = [
    { ...PAYMENT_DATE_FIELD, filter: true, sortable: true },
    { list: 'transferDate', registry: 'loadedAt', filter: true, sortable: true },
    { list: 'order', registry: 'paymentOrder', filter: true },
    { list: 'type', registry: 'type', filter: true },
    { list: 'amount', registry: 'amount', sortable: true },
]

export const PAYMENTS_EMPTY_SORT_QUERY_VALUE = 'none'

export const getDefaultPaymentSort = (type: ViewTypes): string => {
    return `${PAYMENT_DATE_FIELD[type]}_DESC`
}

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

    COMMON_PAYMENT_FIELDS.filter(({ filter }) => filter).forEach((filterKeys) => {
        const currentKey = filterKeys[currentType]
        const value = normalizeFilterValue(currentKey, filters[currentKey])
        if (value) {
            transferredFilters[filterKeys[nextType]] = value
        }
    })

    return transferredFilters
}

export const getTransferredPaymentSort = (
    sort: string | string[] | undefined,
    currentType: ViewTypes,
    nextType: ViewTypes
): string | undefined => {
    const currentSort = Array.isArray(sort) ? sort[0] : sort
    if (!currentSort || currentType === nextType) return currentSort
    if (currentSort === PAYMENTS_EMPTY_SORT_QUERY_VALUE) return PAYMENTS_EMPTY_SORT_QUERY_VALUE

    const separatorIndex = currentSort.lastIndexOf('_')
    if (separatorIndex < 1) return undefined

    const currentKey = currentSort.slice(0, separatorIndex)
    const direction = currentSort.slice(separatorIndex + 1)
    if (direction !== 'ASC' && direction !== 'DESC') return undefined

    const field = COMMON_PAYMENT_FIELDS.find(({ sortable, ...keys }) => (
        sortable && keys[currentType] === currentKey
    ))

    return field ? `${field[nextType]}_${direction}` : PAYMENTS_EMPTY_SORT_QUERY_VALUE
}
