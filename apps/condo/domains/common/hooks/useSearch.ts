import debounce from 'lodash/debounce'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'

type UseSearchOutputType = [string, (search: string) => void, () => void]

export const useSearch = <F> (): UseSearchOutputType => {
    const router = useRouter()
    const filtersFromQuery = useMemo(() => getFiltersFromQuery<F>(router.query), [router.query])
    const searchValueFromQuery = get(filtersFromQuery, 'search')
    const [search, setSearch] = useState(searchValueFromQuery)

    const searchChange = useMemo(() => debounce(async (searchString) => {
        const newParameters = getFiltersQueryData({ ...filtersFromQuery, search: searchString })
        await updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false })
    }, 400), [router, filtersFromQuery])

    const handleSearchChange = useCallback((value: string): void => {
        setSearch(value)
        searchChange(value)
    }, [searchChange])

    const handleResetSearch = useCallback(() => {
        setSearch('')
    }, [])

    return [search, handleSearchChange, handleResetSearch]
}
