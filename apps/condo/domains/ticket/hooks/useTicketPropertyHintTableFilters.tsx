import { useMemo } from 'react'

import { TicketPropertyHintWhereInput } from '@app/condo/schema'

import { getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'

const filterName = getStringContainsFilter('name')

export const useTicketPropertyHintTableFilters = (): Array<FiltersMeta<TicketPropertyHintWhereInput>> => {
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