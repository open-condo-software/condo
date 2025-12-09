import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { TableRef } from '@open-condo/ui/src'

import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'


type UseSearchOutputType = [string, (search: string) => void, () => void]

/**
 * @deprecated use useTableSearch
 */
export const useSearch = <F> (debounceTime: number = 400): UseSearchOutputType => {
    const router = useRouter()
    const filtersFromQuery = useMemo(() => getFiltersFromQuery<F>(router.query), [router.query])
    const searchValueFromQuery = get(filtersFromQuery, 'search')
    const [search, setSearch] = useState(searchValueFromQuery)

    const searchChange = useMemo(() => debounce(async (searchString) => {
        const newParameters = getFiltersQueryData({ ...filtersFromQuery, search: searchString })
        await updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false, shallow: true })
    }, debounceTime), [router, filtersFromQuery, debounceTime])

    const handleSearchChange = useCallback((value: string): void => {
        setSearch(value)
        searchChange(value)
    }, [searchChange])

    const handleResetSearch = useCallback(() => {
        setSearch('')
    }, [])

    useEffect(() => {
        if (!isEqual(searchValueFromQuery, search)) {
            setSearch(searchValueFromQuery)
        }
    }, [searchValueFromQuery])

    return [search, handleSearchChange, handleResetSearch]
}

export const useTableSearch = (tableRef: TableRef, debounceTime: number = 400): UseSearchOutputType => {
    const [search, setSearch] = useState<string>('')

    const searchChange = useMemo(() => debounce((value: string) => {
        tableRef?.api?.setGlobalFilter(value)
    }, debounceTime), [tableRef?.api, debounceTime])

    const handleSearchChange = useCallback((value: string): void => {
        setSearch(value)
        searchChange(value)
    }, [searchChange])

    const handleResetSearch = useCallback(() => {
        setSearch('')
        searchChange('')
    }, [searchChange])

    return [search, handleSearchChange, handleResetSearch]
}
