import { getStringContainsFilter, DataIndexType, FilterType } from '@condo/domains/common/utils/tables.utils'

export const getMoneyFilter = (dataIndex: DataIndexType, separator: string): FilterType => {
    const defaultFilter = getStringContainsFilter(dataIndex)
    return function filterMoney(search: string) {
        if (!search) return
        const replaced = search.replace(separator, '.')
        return defaultFilter(replaced)
    }
}
