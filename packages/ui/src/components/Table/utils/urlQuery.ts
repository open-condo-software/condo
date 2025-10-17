import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'

import { TableParamsRequest } from '../types'

export type QueryArgType = string | Array<string>
export type FiltersFromQueryType = { [key: string]: QueryArgType }

export type SorterColumn = {
    columnKey: string
    order: 'ascend' | 'descend'
}

export enum FULL_TO_SHORT_ORDERS_MAP {
    ascend = 'ASC',
    descend = 'DESC',
}

enum SHORT_TO_FULL_ORDERS_MAP {
    ASC = 'ascend',
    DESC = 'descend',
}

export const parseUrlQuery = (search?: string): Record<string, string | string[]> => {
    if (!search) {
        search = typeof window !== 'undefined' ? window.location.search : ''
    }
    
    const params = new URLSearchParams(search)
    const result: Record<string, string | string[]> = {}
    
    for (const [key, value] of params.entries()) {
        if (result[key]) {
            if (Array.isArray(result[key])) {
                (result[key] as string[]).push(value)
            } else {
                result[key] = [result[key] as string, value]
            }
        } else {
            result[key] = value
        }
    }
    
    return result
}

export const getFiltersFromQuery = (query: Record<string, string | string[]>): { [x: string]: QueryArgType } => {
    const { filters } = query
    if (!filters || typeof filters !== 'string') {
        return {}
    }
    try {
        const json = JSON.parse(filters)
        const result: { [x: string]: QueryArgType } = {}
        Object.keys(json).forEach((key) => {
            const value = json[key]
            if (Array.isArray(value)) {
                result[key] = value.filter((v) => typeof v === 'string' && Boolean(v))
            } else {
                if (typeof value === 'string' && !!value) result[key] = value
            }
        })
        return result
    } catch (e) {
        return {}
    }
}


export const getSortersFromQuery = (query: Record<string, string | string[]>): SorterColumn[] => {
    const sorters = get(query, 'sort', [])
    
    let sortArray: string[] = []
    if (Array.isArray(sorters)) {
        sortArray = sorters
    } else if (typeof sorters === 'string') {
        try {
            sortArray = [JSON.parse(sorters)]
        } catch {
            sortArray = sorters.split(',')
        }
    }

    return sortArray
        .map((sorter) => {
            const [column, order] = sorter.split('_')
            if (!column || !order || !(order in SHORT_TO_FULL_ORDERS_MAP)) return undefined
            return { 
                columnKey: column, 
                order: (SHORT_TO_FULL_ORDERS_MAP as Record<string, 'ascend' | 'descend'>)[order] as 'ascend' | 'descend',
            }
        })
        .filter((sorter): sorter is SorterColumn => sorter !== undefined)
}


export const getPageIndexFromStartRow = (startRow: number, pageSize: number): number => {
    return Math.floor(startRow / pageSize)
}

export const defaultParseUrlQuery = (pageSize: number): TableParamsRequest => {
    const query = parseUrlQuery()
    
    const filters = getFiltersFromQuery(query)
    const sorters = getSortersFromQuery(query)
    
    const queryOffset = get(query, 'offset')
    const offset = Number(queryOffset) ? Number(queryOffset) : 0
    const pageIndex = Math.floor(offset / pageSize)
    const newStartRow = pageIndex * pageSize

    return { 
        filterModel: filters, 
        sortModel: sorters.map(sorter => ({
            id: sorter.columnKey,
            desc: sorter.order === 'descend',
        })), 
        startRow: newStartRow, 
        endRow: newStartRow + pageSize,
    }
}


export const updateUrl = (
    newParams: Record<string, unknown>, 
    options?: { 
        resetOldParameters?: boolean 
        shallow?: boolean 
    }
) => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    
    if (options?.resetOldParameters) {
        url.search = ''
    }

    Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
            url.searchParams.delete(key)
        } else if (value !== undefined) {
            const query = JSON.stringify(value)
            url.searchParams.set(key, query)
        }
    })

    if (options?.shallow) {
        window.history.replaceState({}, '', url.toString())
    } else {
        window.history.pushState({}, '', url.toString())
    }
}

export const defaultUpdateUrlCallback = (params: TableParamsRequest) => {
    const { startRow, filterModel, sortModel } = params

    let newOffset
    if (startRow !== undefined && startRow > 0) {
        newOffset = startRow
    } else if (startRow === 0) {
        newOffset = null
    }

    let newFilters
    if (filterModel && Object.keys(filterModel).length > 0) {
        newFilters = { ...filterModel }
    } else {
        newFilters = null
    }

    let newSorters
    if (sortModel && sortModel.length > 0) {
        const sorter = sortModel[0]
        if (sorter) {
            const order = sorter.desc ? 'descend' : 'ascend'
            newSorters = `${sorter.id}_${FULL_TO_SHORT_ORDERS_MAP[order]}`
        }
    } else {
        newSorters = null
    }

    // @ts-ignore
    const newParameters = getFiltersQueryData(newFilters, newSorters, newOffset)

    return updateUrl(newParameters, { resetOldParameters: false, shallow: true })
}

export function getFiltersQueryData (newFilters?: FiltersFromQueryType | null, sort?: string[] | null, offset?: number | null) {
    const possibleFilters = newFilters ? pickBy(newFilters, (value) => !isEmpty(value)) as FiltersFromQueryType : undefined
    
    return { 
        sort, 
        offset, 
        filters: possibleFilters, 
    }
}