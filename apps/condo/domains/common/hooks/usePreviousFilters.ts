import { isObject } from 'lodash'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

import { updateQuery } from '@condo/domains/common/utils/helpers'


class PreviousQueryParams {
    private static key = 'preview-query-params'

    static set (path: string, queryParams: Record<string, unknown>, tab?: string) {
        if (!path) return

        let fullPath = path
        if (tab) fullPath += `?tab=${tab}`

        const allQueryParamsFromLocalStorage = this.getAll()
        const newQueryParams = { ...allQueryParamsFromLocalStorage, [fullPath]: queryParams }
        const newQueryParamsAsJson = JSON.stringify(newQueryParams)
        localStorage.setItem(this.key, newQueryParamsAsJson)
    }

    static get (path: string, tab?: string) {
        if (!path) return

        let fullPath = path
        if (tab) fullPath += `?tab=${tab}`

        const queryParamsAsJson = localStorage.getItem(this.key)
        if (!queryParamsAsJson) return

        try {
            const queryParams = JSON.parse(queryParamsAsJson)
            if (!isObject(queryParams)) return

            const queryParamsByPath = get(queryParams, fullPath)
            if (!isObject(queryParamsByPath)) return

            return queryParamsByPath
        } catch (error) {
            console.error('Cannot parse previous query params by path', { error, queryParamsAsJson, fullPath, path, tab })
            return
        }
    }

    private static getAll () {
        const queryParamsAsJson = localStorage.getItem(this.key)
        if (!queryParamsAsJson) return

        try {
            const queryParams = JSON.parse(queryParamsAsJson)
            if (!isObject(queryParams)) return

            return queryParams
        } catch (error) {
            console.error('Cannot parse previous query params', { error, queryParamsAsJson })
            return
        }
    }
}

export const usePreviousQueryParams = (pages: Array<string>) => {
    const router = useRouter()
    const filters = useMemo(() => get(router, 'query.filters'), [router])
    const sort = useMemo(() => get(router, 'query.sort'), [router])

    const path = router.pathname
    const query = router.query
    const tab = get(router, 'query.tab')

    useEffect(() => {
        if (!pages.includes(path)) return
        if (!isEmpty(sort) || !isEmpty(filters)) return

        const fromLocalStorage = PreviousQueryParams.get(path, tab)
        if (!fromLocalStorage) return

        const newParameters = { ...query, ...fromLocalStorage }
        updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false })
    }, [path, tab])

    useEffect(() => {
        if (!pages.includes(path)) return

        const queryParamsToSave = { sort, filters: filters }
        PreviousQueryParams.set(path, queryParamsToSave, tab)
    }, [sort, filters, path, tab])
}
