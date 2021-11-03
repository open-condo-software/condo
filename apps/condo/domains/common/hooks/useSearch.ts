import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { get, debounce } from 'lodash'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { setFiltersToQuery } from '../utils/filters.utils'

export const useSearch = <F> (loading: boolean): [string, (search: string) => void] => {
    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<F>(router.query)
    const searchValue = get(filtersFromQuery, 'search')
    const [search, setSearch] = useState(searchValue)

    useEffect(() => {
        if (!searchValue) {
            setSearch('')
        }
    }, [searchValue])

    const searchChange = useCallback(debounce(async (searchString) => {
        await setFiltersToQuery(router, { ...filtersFromQuery, search: searchString }, true)
    }, 400), [loading, filtersFromQuery])

    const handleSearchChange = (value: string): void => {
        setSearch(value)
        searchChange(value)
    }

    return [search, handleSearchChange]
}
