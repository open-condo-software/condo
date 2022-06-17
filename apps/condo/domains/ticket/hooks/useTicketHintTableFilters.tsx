import { useMemo } from 'react'

import { getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import { TicketHintWhereInput } from '@app/condo/schema'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'

const filterName = getStringContainsFilter('name')

export const useTicketHintTableFilters = (): Array<FiltersMeta<TicketHintWhereInput>> => {
    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [
                    filterName,
                ],
                combineType: 'OR',
            },
        ]
    }, [])
}