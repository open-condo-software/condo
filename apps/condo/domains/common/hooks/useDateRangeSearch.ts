import dayjs from 'dayjs'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'

type DayJSRangeType = [dayjs.Dayjs, dayjs.Dayjs]

export const useDateRangeSearch = <F> (
    filterKey: string
): [null | DayJSRangeType, (search: DayJSRangeType) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)
    const searchValueFromQuery = get(filtersFromQuery, filterKey, null)
    const dateRange: DayJSRangeType = isArray(searchValueFromQuery)
        ? [dayjs(searchValueFromQuery[0]), dayjs(searchValueFromQuery[1])]
        : null

    const searchChange = useCallback(
        debounce(
            async (searchString) => {
                const newParameters = getFiltersQueryData({
                    ...filtersFromQuery,
                    [filterKey]: searchString,
                })
                await updateQuery(router, { newParameters }, { resetOldParameters: false, shallow: true })
            },
            400,
        ),
        [searchValueFromQuery],
    )

    const handleSearchChange = (value: DayJSRangeType): void => {
        searchChange(value)
    }

    return [dateRange, handleSearchChange]
}
