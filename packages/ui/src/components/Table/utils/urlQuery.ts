import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'

import { FullTableState, RowSelectionState, SortState } from '@open-condo/ui/src'

type ParsedUrlQuery = Record<string, string | string[]>

type QueryArgType = string | string[]
type FiltersFromQueryType = { [key: string]: QueryArgType }

const DESC = 'DESC'
const ASC = 'ASC'

const getFiltersFromQuery = (query: ParsedUrlQuery): { [x: string]: QueryArgType } => {
    const { filters } = query
    if (!filters || typeof filters !== 'string') {
        return {}
    }
    try {
        const json = JSON.parse(filters)
        const result: { [x: string]: QueryArgType } = {}
        Object.keys(json).forEach((key) => {
            const value = json[key]
            if (Array.isArray(value)) result[key] = value.filter((v) => typeof v === 'string' && Boolean(v))
            if (typeof value === 'string' && !!value) result[key] = value
        })
        return result
    } catch {
        return {}
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
                sortArray = sorters.split(',')
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

const updateUrl = (
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
        if (!value) {
            url.searchParams.delete(key)
        } else {
            const query = typeof value === 'string' ? value : JSON.stringify(value)
            if (query === '{}' || query === '[]' || query === '""') {
                url.searchParams.delete(key)
            } else {
                url.searchParams.set(key, query)
            }
        }
    })

    if (options?.shallow) {
        window.history.replaceState({}, '', url.toString())
    } else {
        window.history.pushState({}, '', url.toString())
    }
}

/**
 * @deprecated This function is experimental. API may change at any time without notice.
 * 
 * @experimental
 * 
 * This function is in experimental stage of development.
 * API may be changed at any moment without prior notice.
 * Use with caution in production.
 * 
 * @param query - Query object to parse
 * @param pageSize - Page size to use
 * @returns Full table state parsed from query
 */
export const defaultParseUrlQuery = (query: Record<string, string | string[]>, pageSize: number): FullTableState => {
    const filters = getFiltersFromQuery(query)
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
        rowSelectionState: rowSelection,
    }
}

/**
 * @deprecated This function is experimental. API may change at any time without notice.
 * 
 * @experimental
 * 
 * This function is in experimental stage of development.
 * API may be changed at any moment without prior notice.
 * Use with caution in production.
 * 
 * @param params - Full table state to update
 * @returns void
 */
export const defaultUpdateUrlQuery = (params: FullTableState) => {
    const { startRow, filterState, sortState, rowSelectionState } = params

    let newOffset
    if (startRow !== undefined && startRow > 0) {
        newOffset = startRow
    } else if (startRow === 0) {
        newOffset = null
    }

    let newFilters
    if (filterState && Object.keys(filterState).length > 0) {
        const possibleDate = pickBy(filterState, (value, key) => typeof key === 'string' && (typeof value === 'string' && !isEmpty(value) || Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string' && !isEmpty(item)))) as FiltersFromQueryType
        if (Object.keys(possibleDate).length > 0) {
            newFilters = possibleDate
        } else {
            newFilters = null
        }
    } else {
        newFilters = null
    }

    let newSorters
    if (sortState && sortState.length > 0) {
        const sorter = sortState[0]
        if (sorter) {
            newSorters = `${sorter.id}_${sorter.desc ? DESC : ASC}`
        }
    } else {
        newSorters = null
    }

    let newSelectedRows
    if (rowSelectionState && rowSelectionState.length > 0) {
        newSelectedRows = [...rowSelectionState]
    } else {
        newSelectedRows = null
    }

    const newParameters = { 
        offset: newOffset, 
        filters: newFilters, 
        sort: newSorters, 
        selectedRows: newSelectedRows,
    }

    return updateUrl(newParameters, { resetOldParameters: false, shallow: true })
}