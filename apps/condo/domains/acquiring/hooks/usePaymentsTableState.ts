import isEqual from 'lodash/isEqual'
import { useRouter } from 'next/router'
import { RefObject, useEffect, useMemo, useRef } from 'react'

import { FullTableState, RowSelectionState, TableRef } from '@open-condo/ui'

import { ViewTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { getPaymentColumnFilterState } from '@condo/domains/acquiring/utils/paymentFilters'
import { DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { FiltersFromQueryType } from '@condo/domains/common/utils/tables.utils'
import { defaultParseUrlQuery } from '@condo/domains/common/utils/tableUrls'


type UsePaymentsTableStateOptions = {
    defaultSortState: FullTableState['sortState']
    fallbackRowSelectionState?: RowSelectionState
    preserveUrlRowSelection?: boolean
    sortableColumnIds: ReadonlySet<string>
    tableRef: RefObject<TableRef | null>
    type: ViewTypes
}

export const usePaymentsTableState = ({
    defaultSortState,
    fallbackRowSelectionState = [],
    preserveUrlRowSelection = false,
    sortableColumnIds,
    tableRef,
    type,
}: UsePaymentsTableStateOptions) => {
    const router = useRouter()
    const parsedUrlState = useMemo(
        () => defaultParseUrlQuery(router.query as Record<string, string | string[]>, DEFAULT_PAGE_SIZE),
        [router.query]
    )
    const columnFilterState = useMemo(
        () => getPaymentColumnFilterState(parsedUrlState.filterState as FiltersFromQueryType, type),
        [parsedUrlState.filterState, type]
    )
    const filtersFromUrl = useMemo<FiltersFromQueryType>(() => ({
        ...parsedUrlState.filterState as FiltersFromQueryType,
        ...(parsedUrlState.globalFilter ? { search: parsedUrlState.globalFilter } : {}),
    }), [parsedUrlState.filterState, parsedUrlState.globalFilter])
    const sortStateFromUrl = useMemo(
        () => parsedUrlState.sortState.filter(({ id }) => sortableColumnIds.has(id)),
        [parsedUrlState.sortState, sortableColumnIds]
    )
    const normalizedSortState = sortStateFromUrl.length ? sortStateFromUrl : defaultSortState
    const initialTableState = useMemo<FullTableState>(() => ({
        ...parsedUrlState,
        filterState: columnFilterState,
        globalFilter: undefined,
        sortState: normalizedSortState,
        rowSelectionState: preserveUrlRowSelection && parsedUrlState.rowSelectionState.length
            ? parsedUrlState.rowSelectionState
            : fallbackRowSelectionState,
    // Table reads initial state only once. URL changes are handled through its API and data source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [])

    useEffect(() => {
        if (!tableRef.current) return

        const { api } = tableRef.current
        if (!isEqual(api.getFilterState(), columnFilterState)) {
            api.setFilterState(columnFilterState)
        }

        if (!isEqual(api.getSorting(), normalizedSortState)) {
            api.setSorting(normalizedSortState)
        }

        const { startRow } = api.getPagination()
        if (startRow !== parsedUrlState.startRow) {
            api.setPagination({
                startRow: parsedUrlState.startRow,
                endRow: parsedUrlState.startRow + DEFAULT_PAGE_SIZE,
            })
        }
    }, [columnFilterState, normalizedSortState, parsedUrlState.startRow, tableRef])

    return {
        columnFilterState,
        filtersFromUrl,
        initialTableState,
        parsedUrlState,
    }
}

type UsePaymentsTableDataRefreshOptions = {
    columnFilterState: FiltersFromQueryType
    filtersKey: string
    tableRef: RefObject<TableRef | null>
}

export const usePaymentsTableDataRefresh = ({
    columnFilterState,
    filtersKey,
    tableRef,
}: UsePaymentsTableDataRefreshOptions): void => {
    const previousFiltersKeyRef = useRef(filtersKey)
    const previousColumnFilterStateRef = useRef(columnFilterState)

    useEffect(() => {
        if (previousFiltersKeyRef.current === filtersKey || !tableRef.current) return
        previousFiltersKeyRef.current = filtersKey

        const haveColumnFiltersChanged = !isEqual(previousColumnFilterStateRef.current, columnFilterState)
        previousColumnFilterStateRef.current = columnFilterState
        if (haveColumnFiltersChanged) return

        const { startRow } = tableRef.current.api.getPagination()
        if (startRow > 0) {
            tableRef.current.api.setPagination({ startRow: 0, endRow: DEFAULT_PAGE_SIZE })
        } else {
            tableRef.current.api.refetchData()
        }
    }, [columnFilterState, filtersKey, tableRef])
}
