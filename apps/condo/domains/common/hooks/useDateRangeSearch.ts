import { updateQuery } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import dayjs from 'dayjs'
import { debounce, get } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'

const DATE_FORMAT_FOR_QUERY = 'YYYY-MM-DD'

export const useDateRangeSearch = <F> (
    filterKey: string,
    loading: boolean,
    defaultValue: [dayjs.Dayjs, dayjs.Dayjs] = [null, null]
): [[dayjs.Dayjs, dayjs.Dayjs], (search: [dayjs.Dayjs, dayjs.Dayjs]) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)
    const searchValueFromQuery = get(filtersFromQuery, filterKey)
    const [search, setSearch] = useState(searchValueFromQuery || defaultValue)

    const searchChange = useCallback(
        debounce(
            async (searchString: [dayjs.Dayjs, dayjs.Dayjs]) => {
                await updateQuery(router, {
                    ...filtersFromQuery,
                    [filterKey]: searchString.map((x) => x.format(DATE_FORMAT_FOR_QUERY)),
                })
            },
            400
        ),
        [loading, filtersFromQuery]
    )

    const handleSearchChange = (value: [dayjs.Dayjs, dayjs.Dayjs]): void => {
        setSearch(value)
        searchChange(value)
    }

    return [search.map((x) => dayjs(x)) || searchValueFromQuery, handleSearchChange]
}
