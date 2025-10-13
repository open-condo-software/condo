import {
    getCoreRowModel,
    useReactTable,
    RowData,
    CellContext,
    AccessorFn,
    createColumnHelper,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    SortingState,
    PaginationState,
    ColumnFiltersState,
} from '@tanstack/react-table'
import React, { useMemo, useState, useEffect } from 'react'

import { TableBody } from '@open-condo/ui/src/components/Table/components/TableBody'
import { TableHeader } from '@open-condo/ui/src/components/Table/components/TableHeader'
import { TablePagination } from '@open-condo/ui/src/components/Table/components/TablePagination'
import { useTableState } from '@open-condo/ui/src/components/Table/hooks/useTableState'
import type { TableColumn, TableProps, FilterModel } from '@open-condo/ui/src/components/Table/types'
import { renderTextWithTooltip } from '@open-condo/ui/src/components/Table/utils/renderTextWithTooltip'
import { parseTableQuery, getPageIndexFromStartRow, getStartEndRows, convertSortingToUrlFormat, updateUrl } from '@open-condo/ui/src/components/Table/utils/urlQuery'


export function Table<TData extends RowData = RowData> ({
    dataSource,
    columns,
    id,
    storageKey = `table-state-${id}`,
    columnMenuLabels = {},
    defaultColumn,
    syncUrlConfig = {
        hasSyncUrl: false,
    },
    loading,
    onRowClick,
    totalRows,
    pageSize = 30,
}: TableProps<TData>): React.ReactElement {

    const isClientTableData = useMemo(() => Array.isArray(dataSource), [dataSource])

    const { filters, startRow, sorters } = useMemo(() => {
        if (!syncUrlConfig?.hasSyncUrl) return { filters: {}, startRow: 0, sorters: [] }
        return parseTableQuery()
    }, [syncUrlConfig?.hasSyncUrl])

    const [tableData, setTableData] = useState<TData[]>(isClientTableData ? (dataSource as TData[]) : [])
    const [sorting, setSorting] = useState<SortingState>(() => {
        if (!syncUrlConfig?.hasSyncUrl || !sorters.length) return []
        return sorters.map(sorter => ({
            id: sorter.columnKey,
            desc: sorter.order === 'descend',
        }))
    })

    // Версия с фильтрами из URL
    // const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    //     if (!syncUrlConfig?.hasSyncUrl) return []
    //     return filters.map(filter => ({
    //         id: filter.id,
    //         value: filter.value,
    //     }))
    // })
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [pagination, setPagination] = useState<PaginationState>(() => {
        if (!syncUrlConfig?.hasSyncUrl) return { pageIndex: 0, pageSize: pageSize }
        const currentPageIndex = getPageIndexFromStartRow(startRow, pageSize)
        return {
            pageIndex: currentPageIndex - 1, // TanStack Table использует 0-based индексы
            pageSize: pageSize,
        }
    })
    const [internalLoading, setInternalLoading] = useState<boolean>(false)

    useEffect(() => {
        if (Array.isArray(dataSource)) {
            setTableData(dataSource as TData[])
        }
    }, [dataSource])

    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }, [sorting, columnFilters])

    // Синхронизируем состояние таблицы с URL
    useEffect(() => {
        if (!syncUrlConfig?.hasSyncUrl) return

        const newUrlParams: Record<string, unknown> = {}

        // Обновляем startRow и endRow на основе пагинации
        const { startRow: newStartRow, endRow: newEndRow } = getStartEndRows(
            pagination.pageIndex, 
            pagination.pageSize
        )
        newUrlParams.startRow = newStartRow
        newUrlParams.endRow = newEndRow

        // Обновляем сортировку в новом формате (массив)
        if (sorting && sorting.length > 0) {
            newUrlParams.sort = convertSortingToUrlFormat(sorting)
        } else {
            newUrlParams.sort = []
        }

        // Обновляем фильтры (пока оставляем как есть из URL)
        if (filters && Object.keys(filters).length > 0) {
            newUrlParams.filters = JSON.stringify(filters)
        }

        // Обновляем URL
        updateUrl(newUrlParams, { resetOldParameters: false, shallow: true })
    }, [syncUrlConfig?.hasSyncUrl, pagination, sorting, filters])

    useEffect(() => {
        if (!isClientTableData && typeof dataSource === 'function') {
            setInternalLoading(true)
            const startRow = pagination.pageIndex * pagination.pageSize
            const endRow = startRow + pagination.pageSize
            const filterModel = columnFilters.reduce((acc, filter) => {
                acc[filter.id] = filter.value
                return acc
            }, {} as FilterModel)
            
            dataSource({
                request: {
                    startRow,
                    endRow,
                    filterModel: filterModel,
                    sortModel: sorting,
                },
                success: ({ rowData }) => {
                    setTableData(rowData as TData[])
                    setInternalLoading(false)
                },
                fail: () => {
                    setTableData([])
                    setInternalLoading(false)
                },
            })
        }
    }, [isClientTableData, dataSource, sorting, pagination, columnFilters])
    
    const columnHelper = createColumnHelper<TData>()
    const tableColumns = useMemo(() => {
        return columns.map(c => {
            const enableSorting = c.enableSorting !== undefined ? c.enableSorting : (defaultColumn?.enableSorting ?? false)
            const enableFilter = c.meta?.filterComponent !== undefined ? true : false

            return columnHelper.accessor(c.dataKey as AccessorFn<TData, unknown>, {
                id: c.id,
                header: c.header,
                enableSorting,
                enableColumnFilter: enableFilter,
                cell: (info: CellContext<TData, unknown>) => c.render?.(info.getValue(), info.row.original, info.row.index) || renderTextWithTooltip()(info.getValue()),
                meta: c.meta,
            })
        })
    }, [columns, columnHelper, defaultColumn])
    
    const {
        columnVisibility,
        columnOrder,
        columnSizing,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
    } = useTableState<TData>({ storageKey, columns, defaultColumn })

    const orderedColumns = useMemo(() => {
        if (columnOrder && columnOrder.length > 0) {
            const columnsById = new Map(columns.map(c => [c.id, c]))
            return columnOrder.map(key => columnsById.get(key)).filter(Boolean) as TableColumn<TData>[] 
        }
        return columns
    }, [columns, columnOrder])

    const table = useReactTable<TData>({
        data: tableData,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        onColumnFiltersChange: setColumnFilters,
        filterFns: {
        },
        manualSorting: !isClientTableData,
        manualPagination: !isClientTableData,
        state: {
            sorting,
            pagination,
            columnFilters,
            columnVisibility,
            columnOrder,
            columnSizing,
        },
        rowCount: totalRows,
        enableMultiSort: false,
        enableColumnResizing: true,
        columnResizeMode: 'onEnd',
        onColumnVisibilityChange: onColumnVisibilityChange,
        onColumnOrderChange: onColumnOrderChange,
        onColumnSizingChange: onColumnSizingChange,
        defaultColumn: {
            minSize: 10,
            size: 150,
        },
    })

    return (
        <div className='condo-table-container'>
            <div className='condo-table'>
                {table.getHeaderGroups().map(headerGroup => (
                    <TableHeader<TData>
                        key={headerGroup.id}
                        headerGroup={headerGroup}
                        columns={orderedColumns}
                        columnMenuLabels={columnMenuLabels}
                        table={table}
                    />
                ))}
                {(loading || (internalLoading && tableData.length > 0)) ? (
                    <div className='condo-table-tbody'>
                        {tableData.length > 0 ? (
                            <TableBody<TData>
                                table={table}
                                onRowClick={onRowClick}
                                showSkeleton
                            />
                        ) : (
                            <div className='condo-table-loading' />
                        )}
                    </div>
                ) : (
                    <TableBody<TData> 
                        table={table} 
                        onRowClick={onRowClick} 
                    />
                )}
            </div>
            {table.getPageCount() > 0 && (
                <TablePagination<TData> table={table} />
            )}
        </div>
    )
}
