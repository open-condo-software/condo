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
import { renderTextWithTooltip } from '@open-condo/ui/src/components/Table/utils/renderCellUtils'
import { getPageIndexFromStartRow } from '@open-condo/ui/src/components/Table/utils/urlQuery'


export function Table<TData extends RowData = RowData> ({
    dataSource,
    columns,
    id,
    storageKey = `table-state-${id}`,
    columnMenuLabels = {},
    defaultColumn,
    syncUrlConfig,
    filterFns,
    loading,
    onRowClick,
    totalRows,
    pageSize = 30,
}: TableProps<TData>): React.ReactElement {

    const isClientTableData = useMemo(() => Array.isArray(dataSource), [dataSource])
    const [tableData, setTableData] = useState<TData[]>(isClientTableData ? (dataSource as TData[]) : [])

    const { filterModel: filters, startRow, sortModel: sorters } = useMemo(() => {
        if (!syncUrlConfig?.parseUrlCallback) return { filterModel: {}, startRow: 0, sortModel: [] }
        return syncUrlConfig.parseUrlCallback(pageSize)
    }, [syncUrlConfig, pageSize])

    const [sorting, setSorting] = useState<SortingState>(() => {
        if (!sorters.length) return []
        return sorters.map(sorter => ({
            id: sorter.id,
            desc: sorter.desc,
        }))
    })

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
        if (!Object.keys(filters).length) return []
        return Object.entries(filters).map(([id, value]) => ({
            id: id,
            value: value,
        }))
    })

    const [pagination, setPagination] = useState<PaginationState>(() => {
        if (!startRow) return { pageIndex: 0, pageSize: pageSize }
        const currentPageIndex = getPageIndexFromStartRow(startRow, pageSize)
        const pageIndex = currentPageIndex - 1
        return {
            pageIndex: pageIndex,
            pageSize: pageSize,
        }
    })
    const [internalLoading, setInternalLoading] = useState<boolean>(false)

    useEffect(() => {
        if (isClientTableData) {
            setTableData(dataSource as TData[])
        } else if (!isClientTableData && typeof dataSource === 'function') {
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

    useEffect(() => {
        if (!syncUrlConfig?.updateUrlCallback) return

        const startRow = pagination.pageIndex * pagination.pageSize
        console.log('startRow', startRow)
        const endRow = startRow + pagination.pageSize
        const filterModel = columnFilters.reduce((acc, filter) => {
            acc[filter.id] = filter.value
            return acc
        }, {} as FilterModel)

        syncUrlConfig.updateUrlCallback({
            startRow: startRow,
            endRow: endRow,
            filterModel: filterModel,
            sortModel: sorting,
        })
    }, [syncUrlConfig, pagination, sorting, columnFilters])
    
    const columnHelper = createColumnHelper<TData>()
    const tableColumns = useMemo(() => {
        return columns.map(c => {
            const enableSorting = c.enableSorting !== undefined ? c.enableSorting : (defaultColumn?.enableSorting ?? false)
            const enableFilter = c.meta?.filterComponent !== undefined ? true : false
            const filterFn = c.meta?.filterFn !== undefined ? c.meta?.filterFn : undefined

            return columnHelper.accessor(c.dataKey as AccessorFn<TData, unknown>, {
                id: c.id,
                header: c.header,
                enableSorting,
                enableColumnFilter: enableFilter,
                cell: (info: CellContext<TData, unknown>) => c.render?.(info.getValue(), info.row.original, info.row.index) || renderTextWithTooltip()(info.getValue()),
                meta: c.meta,
                filterFn,
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
        filterFns,
        manualSorting: !isClientTableData,
        manualFiltering: !isClientTableData,
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
