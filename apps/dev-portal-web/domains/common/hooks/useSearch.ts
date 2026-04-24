import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'

type SearchValue = string | undefined
type SetSearch = (newValue: SearchValue) => void

export function useSearch (): [SearchValue, SetSearch] {
    const router = useRouter()
    const { s } = router.query

    const search = typeof s === 'string' ? s : undefined

    const setSearch = useCallback((newValue: SearchValue) => {
        router.replace({ query: { ...router.query, s: newValue || undefined } }, undefined, { locale: router.locale, shallow: true })
    }, [router])

    return [search, setSearch]
}

export function useDebouncedSearch (delayInMs: number = 500) {
    const [search] = useSearch()
    const [debouncedSearch, setDebouncedSearch] = useState<SearchValue>(search)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search)
        }, delayInMs)

        return () => clearTimeout(handler)
    }, [delayInMs, search])

    return debouncedSearch
}