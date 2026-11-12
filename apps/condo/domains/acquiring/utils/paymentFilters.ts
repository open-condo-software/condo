import { ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'

import type { FiltersFromQueryType } from '@condo/domains/common/utils/tables.utils'


type PaymentFilterKeyByView = Record<ViewTypes, string>

const COMMON_PAYMENT_FILTER_KEYS: PaymentFilterKeyByView[] = [
    { list: 'depositedDate', registry: 'paymentPeriod' },
    { list: 'transferDate', registry: 'loadedAt' },
    { list: 'order', registry: 'paymentOrder' },
    { list: 'type', registry: 'type' },
]

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
        const value = filters[filterKeys[currentType]]
        if (value) {
            transferredFilters[filterKeys[nextType]] = value
        }
    })

    return transferredFilters
}
