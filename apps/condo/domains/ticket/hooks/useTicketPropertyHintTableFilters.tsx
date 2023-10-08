import { TicketPropertyHintPropertyWhereInput, TicketPropertyHintWhereInput } from '@app/condo/schema'
import { useMemo } from 'react'


import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'

const filterAddress = getStringContainsFilter(['property', 'address'])

export const useTicketPropertyHintPropertyFilters = (): Array<FiltersMeta<TicketPropertyHintPropertyWhereInput>> => {
    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [
                    filterAddress,
                ],
                combineType: 'OR',
            },
        ]
    }, [])
}

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