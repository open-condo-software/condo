import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import pickBy from 'lodash/pickBy'

import type {
    FilterState,
    FullTableState,
    RowSelectionState,
    SortState,
} from '@open-condo/ui'

import type { NextRouter } from 'next/router'

type ParsedUrlQuery = Record<string, string | string[]>

const DESC = 'DESC'
const ASC = 'ASC'

const getFiltersFromQuery = (query: ParsedUrlQuery): [{ [x: string]: string | string[] }, string | undefined] => {
    const { filters } = query
    if (!filters || typeof filters !== 'string') {
        return [{}, undefined]
    }
    try {
        const json = JSON.parse(filters)
        const result: { [x: string]: string | string[] } = {}
        let globalFilter: string | undefined = undefined
        Object.keys(json).forEach((key) => {
            const value = json[key]
            if (key === 'search') {
                globalFilter = typeof value === 'string' && !isEmpty(value) ? value : undefined
                return
            }
            if (Array.isArray(value)) result[key] = value.filter((v) => typeof v === 'string' && Boolean(v))
            if (typeof value === 'string' && !isEmpty(value)) result[key] = value
        })
        return [result, globalFilter]
    } catch {
        return [{}, undefined]
    }
}

const getSortersFromQuery = (query: ParsedUrlQuery): SortState => {
    const sorters = query?.sort || []

    let sortArray: string[] = []
    if (Array.isArray(sorters)) {
        sortArray = sorters
    } else if (typeof sorters === 'string') {
        try {
            const parsed = JSON.parse(sorters)
            if (typeof parsed === 'string') {
                sortArray = parsed.split(',')
            } else {
                sortArray = Array.isArray(parsed) ? parsed : [parsed]
            }
        } catch {
            sortArray = sorters.split(',')
        }
    }

    return sortArray
        .map((sorter) => {
            const [column, order] = sorter.split('_')
            if (!column || (order !== ASC && order !== DESC)) return undefined
            return {
                id: column,
                desc: order === DESC,
            }
        })
        .filter((sorter): sorter is { id: string, desc: boolean } => sorter !== undefined)
}

const getRowSelectionFromQuery = (query: ParsedUrlQuery): RowSelectionState => {
    const selectedRows = query?.selectedRows || []

    let selectedRowsArray: string[] = []
    if (Array.isArray(selectedRows)) {
        selectedRowsArray = selectedRows.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
    } else if (typeof selectedRows === 'string') {
        try {
            const json = JSON.parse(selectedRows)
            if (Array.isArray(json)) {
                selectedRowsArray = json.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
            } else if (typeof json === 'string') {
                selectedRowsArray = json.split(',').filter(id => id.trim() !== '').map(id => id.trim())
            }
        } catch {
            selectedRowsArray = selectedRows.split(',').filter(id => id.trim() !== '').map(id => id.trim())
        }
    }

    return selectedRowsArray
}

const normalizeOffset = (startRow: number | undefined): number | null => {
    if (startRow === undefined) return null
    return startRow > 0 ? startRow : null
}

const isValidFilterValue = (value: unknown): boolean => {
    if (typeof value === 'string') {
        return !isEmpty(value)
    }
    if (Array.isArray(value)) {
        return value.length > 0 && value.every(item => typeof item === 'string' && !isEmpty(item))
    }
    return false
}

const normalizeFilters = (filterState: FilterState | undefined, globalFilter: string | undefined): Record<string, unknown> | null => {
    if ((!filterState || Object.keys(filterState).length === 0) && !globalFilter) {
        return null
    }

    const validFilters = pickBy(filterState, (value, key) =>
        typeof key === 'string' && isValidFilterValue(value)
    )

    if (globalFilter && isValidFilterValue(globalFilter)) {
        validFilters.search = globalFilter
    }

    return Object.keys(validFilters).length > 0 ? validFilters : null
}

const normalizeSorters = (sortState: SortState | undefined): string | null => {
    if (!sortState || sortState.length === 0) {
        return null
    }

    const sorter = sortState[0]
    const order = sorter?.desc ? DESC : ASC

    return sorter ? `${sorter.id}_${order}` : null
}

const normalizeSelectedRows = (rowSelectionState: RowSelectionState | undefined): RowSelectionState | null => {
    if (!rowSelectionState || rowSelectionState.length === 0) {
        return null
    }
    return [...rowSelectionState]
}

export const defaultParseUrlQuery = (query: ParsedUrlQuery, pageSize: number): FullTableState => {
    const [filters, globalFilter] = getFiltersFromQuery(query)
    const sorters = getSortersFromQuery(query)
    const rowSelection = getRowSelectionFromQuery(query)

    const offset = Number(query?.offset) ? Number(query?.offset) : 0
    const pageIndex = Math.floor(offset / pageSize)
    const newStartRow = pageIndex * pageSize

    return {
        filterState: filters,
        sortState: sorters,
        startRow: newStartRow,
        endRow: newStartRow + pageSize,
        globalFilter,
        rowSelectionState: rowSelection,
    }
}

export const defaultUpdateUrlQuery = (router: NextRouter, params: FullTableState): void => {
    const { startRow, filterState, sortState, rowSelectionState, globalFilter } = params

    const newParameters = {
        offset: normalizeOffset(startRow),
        filters: normalizeFilters(filterState, globalFilter),
        sort: normalizeSorters(sortState),
        selectedRows: normalizeSelectedRows(rowSelectionState),
    }

    const nextQuery: Record<string, string | number> = {}
    Object.entries(newParameters).forEach(([key, value]) => {
        if (value === null || value === undefined) return
        if (typeof value === 'object') {
            const stringified = JSON.stringify(value)
            if (stringified === '{}' || stringified === '[]' || stringified === '""') return
            nextQuery[key] = stringified
            return
        }
        nextQuery[key] = value as number | string
    })

    if (router && isEqual(router.query, nextQuery)) {
        return
    }

    if (router) {
        router.replace({
            pathname: router.pathname || '/contact',
            query: nextQuery as Record<string, string | string[]>,
        }, undefined, { shallow: true })
    }
}

