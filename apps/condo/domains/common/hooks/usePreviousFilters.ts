import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import pick from 'lodash/pick'
import toPairs from 'lodash/toPairs'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { updateQuery } from '@condo/domains/common/utils/helpers'


class PreviousQueryParams {
    private static STORAGE_KEY_PREFIX = 'previous-query-params'

    static set (employeeId: string, path: string, queryParams: Record<string, unknown>, delimiter?: Record<string, unknown>) {
        if (!isString(employeeId) || !isString(path)) return

        const pageKey = this.getPageKey(path, delimiter)

        const stateFromLocalStorage = this.getAll()
        const allQueryParamsByEmployeeId = get(stateFromLocalStorage, employeeId)
        const newQueryParamsByEmployeeId = { ...allQueryParamsByEmployeeId, [pageKey]: queryParams }
        const newStateAsJson = JSON.stringify({ ...stateFromLocalStorage, [employeeId]: newQueryParamsByEmployeeId })

        localStorage.setItem(this.getStorageKey(), newStateAsJson)
    }

    static get (employeeId: string, path: string, delimiter?: Record<string, unknown>) {
        if (!isString(employeeId) || !isString(path)) return

        const pageKey = this.getPageKey(path, delimiter)

        const stateAsJson = localStorage.getItem(this.getStorageKey())
        if (!stateAsJson) return

        try {
            const stateFromLocalStorage = JSON.parse(stateAsJson)
            if (!isObject(stateFromLocalStorage)) return

            const allQueryParamsByOrganizationId = get(stateFromLocalStorage, employeeId)
            if (!isObject(allQueryParamsByOrganizationId)) return

            const queryParamsByPageKey = get(allQueryParamsByOrganizationId, pageKey)
            if (!isObject(queryParamsByPageKey)) return

            return queryParamsByPageKey
        } catch (error) {
            console.error('Cannot parse previous query params by path', { error, stateAsJson, pageKey, path, delimiter, employeeId })
            return
        }
    }

    private static getAll () {
        const stateAsJson = localStorage.getItem(this.getStorageKey())
        if (!stateAsJson) return

        try {
            const stateFromLocalStorage = JSON.parse(stateAsJson)
            if (!isObject(stateFromLocalStorage)) return

            return stateFromLocalStorage
        } catch (error) {
            console.error('Cannot parse previous query params', { error, stateAsJson })
            return
        }
    }

    private static getStorageKey () {
        return `${this.STORAGE_KEY_PREFIX}-by-employee-id`
    }

    private static getPageKey (path: string, delimiter?: Record<string, unknown>) {
        let pageKey = path
        if (isObject(delimiter) && !isEmpty(delimiter)) {
            const delimiterQueryParams = toPairs(delimiter)
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                .map((paramKeyAndValue) => paramKeyAndValue.join('='))
                .join('&')
            if (delimiterQueryParams) pageKey += `?${delimiterQueryParams}`
        }
        return pageKey
    }
}

const getParams = (query, paramsForSave) => {
    return pick(query, paramsForSave)
}

type usePreviousQueryParamsType = (props: { trackedParamNames: Array<string>, delimitersParamNames?: Array<string>, employeeId?: string }) => void

export const usePreviousQueryParams: usePreviousQueryParamsType = ({
    delimitersParamNames,
    employeeId,
    trackedParamNames,
}) => {
    const router = useRouter()
    const path = router.pathname
    const query = router.query
    const tab = get(router, 'query.tab')

    const withDelimitersParams = useMemo(() => isArray(delimitersParamNames) && !isEmpty(delimitersParamNames), [])

    const trackedParams = useMemo(() => getParams(query, trackedParamNames), [query])
    const delimitersParams = useMemo(() => withDelimitersParams ? getParams(query, delimitersParamNames) : null, [query])

    const applyQueryParamsFromLocalStorage = useCallback(async () => {
        const haveParamsFromQuery = trackedParamNames.some(paramName => !isEmpty(get(trackedParams, paramName)))
        if (haveParamsFromQuery) return

        const paramsFromLocalStorage = PreviousQueryParams.get(employeeId, path, withDelimitersParams ? delimitersParams : null)
        if (!paramsFromLocalStorage) return

        const newParameters = { ...query, ...paramsFromLocalStorage }
        await updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false })
    }, [trackedParams, path, query, router, tab, employeeId, delimitersParams])
    
    const saveQueryParamsToLocalStorage = useCallback(() => {
        const queryParamsToSave = getParams(query, trackedParamNames)
        PreviousQueryParams.set(employeeId, path, queryParamsToSave, withDelimitersParams ? delimitersParams : null)
    }, [path, query, tab, employeeId, delimitersParams])

    // Case with tabs
    useDeepCompareEffect(() => {
        if (!employeeId) return
        if (withDelimitersParams) return
        applyQueryParamsFromLocalStorage()
    }, [employeeId])
    useDeepCompareEffect(() => {
        if (!employeeId) return
        if (withDelimitersParams) return
        saveQueryParamsToLocalStorage()
    }, [employeeId, trackedParams])

    // Case without tabs
    useDeepCompareEffect(() => {
        if (!employeeId) return
        if (!withDelimitersParams) return
        applyQueryParamsFromLocalStorage()
    }, [employeeId, delimitersParams])
    useDeepCompareEffect(() => {
        if (!employeeId) return
        if (!withDelimitersParams) return
        saveQueryParamsToLocalStorage()
    }, [employeeId, trackedParams, delimitersParams])
}
