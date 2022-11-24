import {
    DataIndexType,
    FilterType,
    getDecimalFilter,
} from '@condo/domains/common/utils/tables.utils'
import { BillingCategory, BillingReceipt } from '@app/condo/schema'


export const getDecimalMoneyFilter = (dataIndex: DataIndexType, separator: string): FilterType => {
    const defaultFilter = getDecimalFilter(dataIndex)
    return function filterMoney (search: string) {
        if (!search) return
        const replaced = search.replace(separator, '.')
        if (isNaN(Number(replaced))) return
        return defaultFilter(replaced)
    }
}

export interface IFilters extends Pick<BillingReceipt, 'category'> {
    category?: BillingCategory
}