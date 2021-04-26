import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import qs from 'qs'
import { pickBy, get, debounce } from 'lodash'

export const useSearch = (filtersFromQuery, loading) => {
    const router = useRouter()
    const searchValue = get(filtersFromQuery, 'search')
    const [search, setSearch] = useState(searchValue)

    const searchChange = useCallback(debounce((e) => {
        const query = qs.stringify(
            { ...router.query, filters: JSON.stringify(pickBy({ ...filtersFromQuery, search: e })) },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        router.push(router.route + query)
    }, 400), [loading])

    const handeleSearchChange = search => { //handeleSearchChange
        setSearch(search)
        searchChange(search)
    }
    return [search, handeleSearchChange]
}
