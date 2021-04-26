import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import qs from 'qs'
import { pickBy, get, debounce } from 'lodash'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'

export const useSearch = (loading): [string, (search: string) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery(router.query)
    const searchValue = get(filtersFromQuery, 'search')
    const [search, setSearch] = useState(searchValue) as [string, (search: string) => void]

    const searchChange = useCallback(debounce((e) => {
        const query = qs.stringify(
            { ...router.query, filters: JSON.stringify(pickBy({ ...filtersFromQuery, search: e })) },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        router.push(router.route + query)
    }, 400), [loading])

    const handeleSearchChange = (value: string): void => {
        setSearch(value)
        searchChange(value)
    }

    return [search, handeleSearchChange]
}
