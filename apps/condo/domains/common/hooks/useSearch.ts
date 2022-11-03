import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import debounce from 'lodash/debounce'

import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { updateQuery } from '@condo/domains/common/utils/filters.utils'

export const useSearch = <F> (loading: boolean): [string, (search: string) => void] => {
    const router = useRouter()
    const filtersFromQuery = useMemo(() => getFiltersFromQuery<F>(router.query), [router.query])
    const searchValueFromQuery = get(filtersFromQuery, 'search')
    const [search, setSearch] = useState(searchValueFromQuery)

    const searchChange = useMemo(() => debounce(async (searchString) => {
        await updateQuery(router, { ...filtersFromQuery, search: searchString })
    }, 400), [router, filtersFromQuery])

    const handleSearchChange = (value: string): void => {
        setSearch(value)
        searchChange(value)
    }

    return [search, handleSearchChange]
}
