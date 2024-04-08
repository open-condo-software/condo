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

type UsePreviousQueryParamsProps = { trackedParamNames: Array<string>, paramNamesForPageChange?: Array<string>, employeeSpecificKey?: string }
type UsePreviousQueryParamsType = (props: UsePreviousQueryParamsProps) => void

/**
 * This hook saves the tracked parameters from the URL in local storage when they change.
 * When opening the page again takes out the saved parameters from local storage and inserts them into the URL.
 *
 * If the URL already contains tracked parameters, then they are used.
 *
 * @param paramNamesForPageChange Names of sensitive parameters whose changes are perceived as a page change
 * @param employeeSpecificKey It could just be employee ID or organization ID + user ID
 * @param trackedParamNames Names of parameters whose changes need to be tracked and saved
 */
export const usePreviousQueryParams: UsePreviousQueryParamsType = ({
    paramNamesForPageChange,
    employeeSpecificKey,
    trackedParamNames,
}) => {
    const router = useRouter()
    const path = router.pathname
    const query = router.query

    const withDelimitersParams = useMemo(() => isArray(paramNamesForPageChange) && !isEmpty(paramNamesForPageChange), [])

    const trackedParams = useMemo(() => getParams(query, trackedParamNames), [query])
    const delimitersParams = useMemo(() => withDelimitersParams ? getParams(query, paramNamesForPageChange) : null, [query])

    const applyQueryParamsFromLocalStorage = useCallback(async () => {
        const haveParamsFromQuery = trackedParamNames.some(paramName => !isEmpty(get(trackedParams, paramName)))
        if (haveParamsFromQuery) return

        const paramsFromLocalStorage = PreviousQueryParams.get(employeeSpecificKey, path, delimitersParams)
        if (!paramsFromLocalStorage) return

        const newParameters = { ...query, ...paramsFromLocalStorage }
        await updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false })
    }, [trackedParams, path, query, router, employeeSpecificKey, delimitersParams])
    
    const saveQueryParamsToLocalStorage = useCallback(() => {
        const queryParamsToSave = getParams(query, trackedParamNames)
        PreviousQueryParams.set(employeeSpecificKey, path, queryParamsToSave, delimitersParams)
    }, [path, query, employeeSpecificKey, delimitersParams])

    useDeepCompareEffect(() => {
        if (!employeeSpecificKey) return
        applyQueryParamsFromLocalStorage()
    }, [employeeSpecificKey, delimitersParams])
    useDeepCompareEffect(() => {
        if (!employeeSpecificKey) return
        saveQueryParamsToLocalStorage()
    }, [employeeSpecificKey, trackedParams, delimitersParams])
}

type UsePreviousSortAndFiltersProps = Pick<UsePreviousQueryParamsProps, 'employeeSpecificKey' | 'paramNamesForPageChange'>
type UsePreviousSortAndFiltersType = (props: UsePreviousSortAndFiltersProps) => void

export const usePreviousSortAndFilters: UsePreviousSortAndFiltersType = ({ employeeSpecificKey, paramNamesForPageChange }) => {
    usePreviousQueryParams({ trackedParamNames: ['sort', 'filters'], employeeSpecificKey, paramNamesForPageChange })
}
