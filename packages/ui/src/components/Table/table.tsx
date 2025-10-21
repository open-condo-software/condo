import {
    getCoreRowModel,
    useReactTable,
    RowData,
    CellContext,
    AccessorFn,
    createColumnHelper,
    SortingState,
    PaginationState,
    ColumnFiltersState,
    RowSelectionState,
    HeaderContext,
} from '@tanstack/react-table'
import React, { useMemo, useState, useEffect } from 'react'

import { Checkbox } from '@open-condo/ui'
import { TableBody } from '@open-condo/ui/src/components/Table/components/TableBody'
import { TableHeader } from '@open-condo/ui/src/components/Table/components/TableHeader'
import { TablePagination } from '@open-condo/ui/src/components/Table/components/TablePagination'
import { DEFAULT_PAGE_SIZE } from '@open-condo/ui/src/components/Table/constans'
import { useTableSetting } from '@open-condo/ui/src/components/Table/hooks/useTableSetting'
import type { TableColumn, TableProps, FilterState } from '@open-condo/ui/src/components/Table/types'
import { renderTextWithTooltip } from '@open-condo/ui/src/components/Table/utils/renderCellUtils'
import { getPageIndexFromStartRow } from '@open-condo/ui/src/components/Table/utils/urlQuery'

const COLUMN_ID_SELECTION = 'selection'

// Need add resize columns
// Need add select columns
export function Table<TData extends RowData = RowData> ({
    id,
    dataSource,
    columns,
    defaultColumn,
    totalRows = 0,
    pageSize = DEFAULT_PAGE_SIZE,
    onTableStateChange,
    initialTableState = { filterState: {}, startRow: 0, endRow: totalRows !== undefined && totalRows > pageSize ? pageSize : totalRows, sortState: [], rowSelection: {} },
    storageKey = `table-settings-${id}`,
    columnMenuLabels = {},
    onRowClick,
    rowSelectionOptions,
    // shouldHidePaginationOnSinglePage?: boolean
}: TableProps<TData>): React.ReactElement {

    const [sorting, setSorting] = useState<SortingState>(initialTableState.sortState)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(Object.entries(initialTableState.filterState).map(([key, value]) => ({ id: key, value: value })))
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: getPageIndexFromStartRow(initialTableState.startRow, pageSize), pageSize: pageSize })
    const [tableData, setTableData] = useState<TData[]>([])
    const [rowCount, setRowCount] = useState<number>(0)
    const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialTableState.rowSelection)
    const [internalLoading, setInternalLoading] = useState<boolean>(true)

    useEffect(() => {
        const fetchData = async () => {
            setInternalLoading(true)
            const startRow = pagination.pageIndex * pagination.pageSize
            const endRow = startRow + pagination.pageSize
            const filterState = columnFilters.reduce((acc, filter) => {
                acc[filter.id] = filter.value
                return acc
            }, {} as FilterState)

            try {
                const tableData = await dataSource({
                    startRow,
                    endRow,
                    filterState,
                    sortState: sorting,
                })
                setTableData(tableData)
                setRowCount(columnFilters.length > 0 ? tableData.length : totalRows)
            } catch (error) {
                // Show error if fetch is down
                setTableData([])
                setRowCount(0)
            } finally {
                setInternalLoading(false)
            }
        }
        
        fetchData()
    }, [dataSource, sorting, pagination, columnFilters, onTableStateChange, totalRows])

    useEffect(() => {
        const handleTableStateChange = async () => {
            if (onTableStateChange) {
                const startRow = pagination.pageIndex * pagination.pageSize
                const endRow = startRow + pagination.pageSize
                const filterState = columnFilters.reduce((acc, filter) => {
                    acc[filter.id] = filter.value
                    return acc
                }, {} as FilterState)
    
                onTableStateChange({
                    startRow,
                    endRow,
                    filterState,
                    sortState: sorting,
                    rowSelection,
                })
            }
        }
        
        handleTableStateChange()
    }, [sorting, pagination, columnFilters, onTableStateChange, totalRows, rowSelection])
    
    const columnHelper = createColumnHelper<TData>()
    const tableColumns = useMemo(() => {
        const resultColumns = []
        if (rowSelectionOptions) {
            resultColumns.push(columnHelper.accessor(rowSelectionOptions.getRowId, {
                id: COLUMN_ID_SELECTION,
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllRowsSelected()}
                        indeterminate={table.getIsSomeRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()} //or getToggleAllPageRowsSelectedHandler
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                ),
                meta: {
                    enableColumnSettings: false,
                },
            }))
        }

        columns.forEach(c => {
            const enableSorting = c.enableSorting !== undefined ? c.enableSorting : (defaultColumn?.enableSorting ?? false)
            const enableColumnFilter = c.filterComponent !== undefined
            const enableColumnSettings = c.enableColumnSettings !== undefined ? c.enableColumnSettings : (defaultColumn?.enableColumnSettings ?? true)
            const enableColumnOptions = enableSorting || enableColumnFilter || enableColumnSettings
            const meta = {
                filterComponent: c.filterComponent,
                enableColumnSettings: enableColumnSettings,
                enableColumnOptions: enableColumnOptions,
            }

            resultColumns.push(columnHelper.accessor(c.dataKey as AccessorFn<TData, unknown>, {
                id: c.id,
                header: typeof c.header === 'string' ? c.header : (info: HeaderContext<TData, unknown>) => {
                    if (typeof c.header === 'function') {
                        return c.header(info)
                    }
                    return c.header
                },
                enableSorting,
                enableColumnFilter,
                cell: (info: CellContext<TData, unknown>) => c.render?.(info.getValue(), info.row.original, info.row.index) || renderTextWithTooltip()(info.getValue()),
                meta: meta,
            }))
        })

        return resultColumns
    }, [columns, columnHelper, defaultColumn, rowSelectionOptions])

    const internalColumns = useMemo(() => {
        const resultColumns: TableColumn<TData>[] = []
        
        if (rowSelectionOptions) {
            resultColumns.push({
                id: COLUMN_ID_SELECTION,
                dataKey: COLUMN_ID_SELECTION,
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllRowsSelected()}
                        indeterminate={table.getIsSomeRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()} //or getToggleAllPageRowsSelectedHandler
                    />
                ),
                initialOrder: 0,
            })
        }

        resultColumns.push(...columns)
        return resultColumns
    }, [columns, rowSelectionOptions])
    
    const {
        columnVisibility,
        columnOrder,
        columnSizing,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
    } = useTableSetting<TData>({ storageKey, columns: internalColumns, defaultColumn })

    const orderedColumns = useMemo(() => {
        if (columnOrder && columnOrder.length > 0) {
            const columnsById = new Map(internalColumns.map(c => [c.id, c]))
            return columnOrder.map(key => columnsById.get(key)).filter(Boolean) as TableColumn<TData>[] 
        }
        return internalColumns
    }, [internalColumns, columnOrder])

    const table = useReactTable<TData>({
        data: tableData,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: (updaterOrValue) => {
            if (pagination.pageIndex !== 0) {
                setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
            }
            setSorting(typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue)
        },
        onPaginationChange: setPagination,
        onColumnFiltersChange: (updaterOrValue) => {
            if (pagination.pageIndex !== 0) {
                setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
            }
            const newFilters = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters) : updaterOrValue
            setColumnFilters(newFilters)
        },
        manualSorting: true,
        manualFiltering: false,
        manualPagination: true,
        state: {
            sorting,
            pagination,
            columnFilters,
            columnVisibility,
            columnOrder,
            columnSizing,
            rowSelection,
        },
        rowCount: rowCount,
        enableMultiSort: false,
        enableColumnResizing: true,
        columnResizeMode: 'onEnd',
        onColumnVisibilityChange: onColumnVisibilityChange,
        onColumnOrderChange: onColumnOrderChange,
        onColumnSizingChange: onColumnSizingChange,
        onRowSelectionChange: setRowSelection,
        enableRowSelection: true,
        getRowId: rowSelectionOptions?.getRowId,
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
                {
                    // We need external loading props? 
                    // loading ? (<div className='condo-table-loading' />) : 
                    <TableBody<TData> 
                        table={table} 
                        onRowClick={onRowClick} 
                        showSkeleton={internalLoading}
                    />
                }
            </div>
            {table.getPageCount() > 0 && (
                <TablePagination<TData> table={table} />
            )}
        </div>
    )
}
