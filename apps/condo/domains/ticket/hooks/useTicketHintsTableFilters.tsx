import React, { useMemo } from 'react'

import { getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import { TicketHintWhereInput, TicketWhereInput } from '../../../schema'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'

const filterName = getStringContainsFilter('name')

export const useTicketHintsTableFilters = (): Array<FiltersMeta<TicketHintWhereInput>> => {
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