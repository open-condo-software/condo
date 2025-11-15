import {
    getCoreRowModel,
    useReactTable,
    RowData,
    CellContext,
    createColumnHelper,
    SortingState,
    PaginationState,
    ColumnFiltersState,
    RowSelectionState,
    HeaderContext,
} from '@tanstack/react-table'
import React, { forwardRef, useImperativeHandle, useMemo, useState, useEffect, useCallback, useRef } from 'react'

import { Checkbox } from '@open-condo/ui/src'
import { TableBody } from '@open-condo/ui/src/components/Table/components/TableBody'
import { TableHeader } from '@open-condo/ui/src/components/Table/components/TableHeader'
import { TablePagination } from '@open-condo/ui/src/components/Table/components/TablePagination'
import {
    DEFAULT_PAGE_SIZE, 
    COLUMN_ID_SELECTION,
} from '@open-condo/ui/src/components/Table/constans'
import { useTableSetting } from '@open-condo/ui/src/components/Table/hooks/useTableSetting'
import type { 
    ColumnDefWithId,
    TableProps, 
    FilterState, 
    TableRef,
    TableApi,
    TableColumnMeta,
} from '@open-condo/ui/src/components/Table/types'
import { getFilterByKey } from '@open-condo/ui/src/components/Table/utils/filterComponents'
import { renderTextWithTooltip } from '@open-condo/ui/src/components/Table/utils/renderCellUtils'

/**
 * @deprecated This component is experimental. API may change at any time without notice.
 * 
 * @experimental
 * 
 * Table component is in experimental stage of development.
 * API may be changed at any moment without prior notice.
 * Use with caution in production.
 * 
 * @template TData - Type of table row data
 */
function TableComponent<TData extends RowData = RowData> (
    props: TableProps<TData>,
    ref: React.Ref<TableRef>
): React.ReactElement {
    const {
        id,
        dataSource,
        columns,
        defaultColumn,
        pageSize = DEFAULT_PAGE_SIZE,
        onTableStateChange,
        initialTableState = { filterState: {}, startRow: 0, endRow: pageSize, sortState: [], rowSelectionState: [] },
        storageKey = `table-settings-${id}`,
        columnMenuLabels = {},
        onRowClick,
        rowSelectionOptions,
        onGridReady,
        // shouldHidePaginationOnSinglePage?: boolean
    } = props

    const columnHelper = createColumnHelper<TData>()
    const tableColumns = useMemo(() => {
        const resultColumns: ColumnDefWithId<TData>[]  = []
        if (rowSelectionOptions) {
            resultColumns.push(columnHelper.accessor(rowSelectionOptions.getRowId, {
                id: COLUMN_ID_SELECTION,
                header: ({ table }) => (
                    <span onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={table.getIsAllRowsSelected()}
                            indeterminate={table.getIsSomeRowsSelected()}
                            onChange={table.getToggleAllRowsSelectedHandler()}
                        />
                    </span>
                ),
                cell: ({ row }) => (
                    <span onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            checked={row.getIsSelected()}
                            disabled={!row.getCanSelect()}
                            onChange={row.getToggleSelectedHandler()}
                        />
                    </span>
                ),
                minSize: 48,
                enableSorting: false,
                enableColumnFilter: false,
                meta: {
                    initialSize: 48,
                    initialOrder: 0,
                    enableColumnSettings: false,
                },
            }) as ColumnDefWithId<TData>)
        }

        columns.forEach(c => {
            const filterComponent = c.filterComponent ? (typeof c.filterComponent === 'function' ? c.filterComponent : getFilterByKey(c.filterComponent)) : undefined
            const enableColumnFilter = !!filterComponent
            const enableColumnSettings = c.enableColumnSettings ?? (defaultColumn?.enableColumnSettings ?? true)
            const enableSorting = c.enableSorting ?? (defaultColumn?.enableSorting ?? false)
            const enableColumnOptions = enableSorting || enableColumnFilter || enableColumnSettings
            const initialSize = c.initialSize ?? (defaultColumn?.initialSize ?? '')
            const initialVisibility = c.initialVisibility ?? (defaultColumn?.initialVisibility ?? true)
            const initialOrder = c.initialOrder
            const meta = {
                filterComponent,
                enableColumnSettings,
                enableColumnOptions,
                initialSize,
                initialVisibility,
                initialOrder,
            } as TableColumnMeta

            resultColumns.push(columnHelper.accessor(c.dataKey, {
                id: c.id,
                header: (info: HeaderContext<TData, unknown>) => {
                    if (typeof c.header === 'string') {
                        return renderTextWithTooltip({ type: 'secondary', ellipsis: { rows: 1 } })(c.header)
                    }
                    if (typeof c.header === 'function') {
                        return c.header(info.table)
                    }
                },
                enableSorting,
                enableColumnFilter,
                minSize: c.minSize,
                cell: (info: CellContext<TData, unknown>) => c.render?.(info.getValue(), info.row.original, info.row.index) || renderTextWithTooltip()(info.getValue()),
                meta: meta,
            }) as ColumnDefWithId<TData>)
        })

        return resultColumns
    }, [columns, columnHelper, defaultColumn, rowSelectionOptions])
    
    const {
        columnVisibility,
        columnOrder,
        columnSizing,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
        resetSettings,
    } = useTableSetting<TData>({ storageKey, columns: tableColumns })

    const orderedColumns = useMemo(() => {
        if (columnOrder && columnOrder.length > 0) {
            const columnsById = Object.fromEntries(tableColumns.map(c => [c.id, c]))
            return columnOrder
                .map(key => columnsById[key])
                .filter((col): col is ColumnDefWithId<TData> => col !== undefined)
        }
        return tableColumns
    }, [tableColumns, columnOrder])

    const [sorting, setSorting] = useState<SortingState>(
        initialTableState.sortState
            .filter(sortCol => tableColumns.find(col => sortCol.id === col.id)?.enableSorting)
    )
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        Object.entries(initialTableState.filterState)
            .map(([key, value]) => ({ id: key, value: value }))
            .filter(filterCol => tableColumns.find(col => filterCol.id === col.id)?.enableColumnFilter)
    )
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: getPageIndexFromStartRow(initialTableState.startRow, pageSize), pageSize: pageSize })
    const [tableData, setTableData] = useState<TData[]>([])
    const [rowCount, setRowCount] = useState<number>(0)
    const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialTableState.rowSelectionState?.reduce((acc, selectedRow) => {
        acc[selectedRow] = true
        return acc
    }, {} as RowSelectionState) || {})
    const [internalLoading, setInternalLoading] = useState<boolean>(true)

    // This effect should be first, because if we have error in this effect, we don't want to change the table state and fetch new data
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
                    rowSelectionState: Object.keys(rowSelection),
                })
            }
        }
        
        handleTableStateChange()
    }, [sorting, pagination, columnFilters, onTableStateChange, rowSelection])

    const stableDataSource = useRef(dataSource)
    
    useEffect(() => {
        stableDataSource.current = dataSource
    }, [dataSource])
    
    const fetchData = useCallback(async (isRefetch: boolean = false) => {
        setInternalLoading(true)
        const startRow = pagination.pageIndex * pagination.pageSize
        const endRow = startRow + pagination.pageSize
        const filterState = columnFilters.reduce((acc, filter) => {
            // We don't need to filter empty string values
            if (filter.value !== '' && filter.value !== null && filter.value !== undefined) {
                acc[filter.id] = filter.value
            }
            return acc
        }, {} as FilterState)

        try {
            const { rowData, rowCount } = await stableDataSource.current({
                startRow,
                endRow,
                filterState,
                sortState: sorting,
            }, isRefetch)
            setTableData(rowData)
            setRowCount(rowCount)
        } catch (error) {
            // Show error if fetch is down
            setTableData([])
            setRowCount(0)
        } finally {
            setInternalLoading(false)
        }
    }, [pagination, columnFilters, sorting])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const table = useReactTable<TData>({
        data: tableData,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: (updaterOrValue) => {
            if (pagination.pageIndex !== 0) {
                setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
            }
            const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue
            
            const validatedSorting = newSorting.filter(sortItem => {
                const column = tableColumns.find(col => col.id === sortItem.id)
                if (!column) return false
                
                return column.enableSorting !== false
            })
            
            setSorting(validatedSorting)
        },
        onPaginationChange: setPagination,
        onColumnFiltersChange: (updaterOrValue) => {
            if (pagination.pageIndex !== 0) {
                setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
            }
            const newFilters = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters) : updaterOrValue

            const filteredFilters = newFilters.filter(filter => {
                const column = tableColumns.find(col => col.id === filter.id)
                if (!column) return false
                if (!column.enableColumnFilter) return false
                
                return (
                    filter.value !== null && 
                    filter.value !== undefined && 
                    Object.keys(filter.value).length !== 0 && 
                    !(Array.isArray(filter.value) && filter.value.length === 0) && 
                    !(typeof filter.value === 'string' && filter.value.trim() === '') 
                )
            })
            setColumnFilters(filteredFilters)
        },
        onRowSelectionChange: (updaterOrValue) => {
            const newRowSelection = typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection) : updaterOrValue
            if (rowSelectionOptions?.onRowSelectionChange) {
                rowSelectionOptions.onRowSelectionChange(Object.keys(newRowSelection))
            }
            setRowSelection(newRowSelection)
        },
        manualSorting: true,
        manualFiltering: true,
        manualPagination: true,
        state: {
            sorting,
            pagination,
            columnFilters,
            columnVisibility,
            columnOrder,
            rowSelection,
            columnSizing,
        },
        rowCount: rowCount,
        enableMultiSort: false,
        enableColumnResizing: true,
        columnResizeMode: 'onEnd',
        onColumnVisibilityChange: onColumnVisibilityChange,
        onColumnOrderChange: onColumnOrderChange,
        onColumnSizingChange: onColumnSizingChange,
        enableRowSelection: !!rowSelectionOptions?.getRowId,
        getRowId: rowSelectionOptions?.getRowId,
        defaultColumn: {
            minSize: 70,
        },
    })

    const stableOnGridReady = useRef<((tableRef: TableRef) => void) | undefined>(onGridReady)

    useEffect(() => {
        console.log('useEffect onGridReady', stableOnGridReady.current, ref)
        if (stableOnGridReady.current && ref && 'current' in ref && ref.current) {
            const fn = stableOnGridReady.current
            stableOnGridReady.current = undefined
            fn(ref.current)
            console.log('useEffect onGridReady called', fn, ref.current)
        }
    }, [ref])

    useImperativeHandle(ref, () => {
        const api: TableApi = {
            setFilterState: (newFilterState: FilterState) => {
                // If we change filter state, we need to reset pagination to the first page
                setPagination(prev => prev.pageIndex !== 0 ? { ...prev, pageIndex: 0 } : prev)
                setColumnFilters((prev) => [...prev, ...Object.entries(newFilterState).map(([key, value]) => {
                    // We don't need to filter empty string values
                    if (value !== '' && value !== null && value !== undefined) {
                        return { id: key, value: value }
                    }
                    return null
                }).filter(Boolean)] as ColumnFiltersState)
            },
            setColumnFilter: (columnId: string, value: unknown) => {
                // If we change column filter, we need to reset pagination to the first page
                setPagination(prev => prev.pageIndex !== 0 ? { ...prev, pageIndex: 0 } : prev)
                setColumnFilters((prev) => {
                    if (value === '' || value === null || value === undefined) {
                        return prev.filter(filter => filter.id !== columnId)
                    }
                    
                    const existingFilterIndex = prev.findIndex(filter => filter.id === columnId)
                    if (existingFilterIndex >= 0) {
                        const newFilters = [...prev]
                        newFilters[existingFilterIndex] = { id: columnId, value: value }
                        return newFilters
                    } else {
                        return [...prev, { id: columnId, value: value }]
                    }
                })
            },
            getFilterState: () => {
                return table.getState().columnFilters.reduce((acc, filter) => {
                    // We don't need to filter empty string values
                    if (filter.value !== '' && filter.value !== null && filter.value !== undefined) {
                        acc[filter.id] = filter.value
                    }
                    return acc
                }, {} as FilterState)
            },
            getColumnFilter: (columnId: string) => {
                return table.getState().columnFilters.find(filter => filter.id === columnId)?.value
            },
            refetchData: async () => {
                fetchData(true)
            },
            getPagination: () => {
                return { startRow: table.getState().pagination.pageIndex * table.getState().pagination.pageSize, endRow: table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getState().pagination.pageSize }
            },
            setPagination: ({ startRow, endRow }: { startRow: number, endRow: number }) => {
                setPagination({ pageIndex: Math.floor(startRow / table.getState().pagination.pageSize), pageSize: endRow - startRow })
            },
            setSorting: (newSorting: SortingState) => {
                // If we change sorting, we need to reset pagination to the first page
                setPagination(prev => prev.pageIndex !== 0 ? { ...prev, pageIndex: 0 } : prev)
                setSorting(newSorting)
            },
            getSorting: () => {
                return table.getState().sorting
            },
            getRowSelection: () => {
                return table.getSelectedRowModel().flatRows.map(row => row.id)
            },
            resetRowSelection: () => {
                table.resetRowSelection()
            },
        }

        const tableRef = { api }

        return tableRef
    }, [table, fetchData])

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
                        resetSettings={resetSettings}
                    />
                ))}
                <TableBody<TData>
                    table={table} 
                    onRowClick={onRowClick} 
                    showSkeleton={internalLoading}
                    columnMenuLabels={columnMenuLabels}
                />
            </div>
            {table.getPageCount() > 0 && (
                <TablePagination<TData> table={table} />
            )}
        </div>
        
    )
}

export const Table = forwardRef(TableComponent) as <TData extends RowData = RowData>(
    props: TableProps<TData> & { ref?: React.Ref<TableRef> }
) => React.ReactElement

function getPageIndexFromStartRow (startRow: number, pageSize: number): number {
    return Math.floor(startRow / pageSize)
}