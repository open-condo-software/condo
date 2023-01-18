import { useMemo } from 'react'

import { getDayRangeFilter } from '@condo/domains/common/utils/tables.utils'


const dateFilter = getDayRangeFilter('date')

export function useTableFilters () {

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [dateFilter],
            },
            {
                keyword: 'date',
                filters: [dateFilter],
            },
        ]
    }, [])
}
