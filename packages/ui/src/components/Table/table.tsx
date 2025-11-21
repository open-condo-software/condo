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
    DEFAULT_MIN_SIZE,
    DEFAULT_PAGE_SIZE, 
    COLUMN_ID_SELECTION,
} from '@open-condo/ui/src/components/Table/constans'
import { useTableSetting } from '@open-condo/ui/src/components/Table/hooks/useTableSetting'
import type { 
    TableProps, 
    FilterState, 
    TableRef,
    TableApi,
    FilterComponent,
    TableColumnMeta,
    ColumnDefWithId,
} from '@open-condo/ui/src/components/Table/types'
import '@open-condo/ui/src/components/Table/types'
import { getFilterComponentByKey } from '@open-condo/ui/src/components/Table/utils/filterComponents'
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
        columnLabels = {},
        onRowClick,
        rowSelectionOptions,
        onGridReady,
        getRowId,
    } = props

    const columnHelper = createColumnHelper<TData>()
    const tableColumns = useMemo(() => {
        const resultColumns: ColumnDefWithId<TData>[] = []
        if (rowSelectionOptions) {
            resultColumns.push(columnHelper.display({
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
                    initialVisibility: true,
                    initialSize: 48,
                    initialOrder: 0,
                    enableColumnSettings: false,
                },
            }) as ColumnDefWithId<TData>)
        }

        columns.forEach(c => {
            const colId = c.id
            const colDataKey = c.dataKey
            const colHeader = (info: HeaderContext<TData, unknown>) => {
                if (typeof c.header === 'string') {
                    return renderTextWithTooltip({ type: 'secondary', ellipsis: { rows: 1 } })(c.header)
                }
                if (typeof c.header === 'function') {
                    return c.header(info.table)
                }
            }
            const colCell = (info: CellContext<TData, unknown>) => c.render?.(info.getValue(), info.row.original, info.row.index) || renderTextWithTooltip()(info.getValue())
            let filterComponent: FilterComponent | undefined
            if (typeof c.filterComponent === 'function') {
                filterComponent = c.filterComponent
            } else if (c.filterComponent && typeof c.filterComponent === 'object' && 'key' in c.filterComponent) {
                const resolved = getFilterComponentByKey(c.filterComponent)
                filterComponent = typeof resolved === 'function' ? resolved : undefined
            } else {
                filterComponent = undefined
            }
            const enableColumnFilter = !!filterComponent
            const enableColumnSettings = c.enableColumnSettings ?? (defaultColumn?.enableColumnSettings ?? true)
            const enableSorting = c.enableSorting ?? (defaultColumn?.enableSorting ?? false)
            const enableColumnMenu = enableSorting || enableColumnFilter || enableColumnSettings
            const colMinSize = c.minSize ?? (defaultColumn?.minSize ?? DEFAULT_MIN_SIZE)
            const initialSize = c.initialSize ?? (defaultColumn?.initialSize ?? '')
            const initialVisibility = c.initialVisibility ?? (defaultColumn?.initialVisibility ?? true)
            const initialOrder = c.initialOrder
            const meta: TableColumnMeta = {
                filterComponent,
                enableColumnSettings,
                enableColumnMenu,
                initialSize,
                initialVisibility,
                initialOrder,
            }

            const colDef = {
                id: colId,
                header: colHeader,
                enableSorting,
                enableColumnFilter,
                minSize: colMinSize,
                cell: colCell,
                meta: meta,
            }

            if (colDataKey) {
                resultColumns.push(columnHelper.accessor(colDataKey, colDef) as ColumnDefWithId<TData>)
            } else {
                resultColumns.push(columnHelper.display(colDef) as ColumnDefWithId<TData>)
            }
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
    const [rowSelection, setRowSelection] = useState<RowSelectionState>(
        initialTableState.rowSelectionState
            ?.reduce((acc, selectedRow) => {
                acc[selectedRow] = true
                return acc
            }, {} as RowSelectionState) || {})
    const [internalLoading, setInternalLoading] = useState<boolean>(true)

    // NOTE: This effect should be first, because if we have error in this effect, we don't want to change the table state and fetch new data
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
            // NOTE: If we change sorting, we need to reset pagination to the first page
            setPagination(prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })
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
            // NOTE: If we change column filters, we need to reset pagination to the first page
            setPagination(prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })

            const newFilters = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters) : updaterOrValue

            const filteredFilters = newFilters.filter(filter => {
                const column = tableColumns.find(col => col.id === filter.id)
                if (!column || !column.enableColumnFilter) return false
                
                const value = filter.value
                if (value === null || value === undefined) return false
                if (typeof value === 'string') return value.trim() !== ''
                if (Array.isArray(value)) return value.length > 0
                if (typeof value === 'object') return Object.keys(value).length > 0
                return true
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
        enableRowSelection: rowSelectionOptions?.enableRowSelection ?? false,
        getRowId: getRowId,
    })

    const stableOnGridReady = useRef<((tableRef: TableRef) => void) | undefined>(onGridReady)

    useEffect(() => {
        if (stableOnGridReady.current && ref && 'current' in ref && ref.current) {
            const fn = stableOnGridReady.current
            stableOnGridReady.current = undefined
            fn(ref.current)
        }
    }, [ref])

    useImperativeHandle(ref, () => {
        const api: TableApi = {
            getFilterState: () => {
                return table.getState().columnFilters.reduce((acc, filter) => { acc[filter.id] = filter.value; return acc }, {} as FilterState)
            },
            setFilterState: (newFilterState: FilterState) => {
                // NOTE: If we change filter state, we need to reset pagination to the first page
                setPagination(prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })
                setColumnFilters((prev) => [...prev, ...Object.entries(newFilterState).map(([key, value]) => ({ id: key, value: value })).filter(Boolean)] as ColumnFiltersState)
            },
            getColumnFilter: (columnId: string) => table.getState().columnFilters.find(filter => filter.id === columnId)?.value,
            setColumnFilter: (columnId: string, value: unknown) => {
                // NOTE: If we change column filter, we need to reset pagination to the first page
                setPagination(prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })
                setColumnFilters((prev) => {                    
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
            getPagination: () => ({ startRow: table.getState().pagination.pageIndex * table.getState().pagination.pageSize, endRow: table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getState().pagination.pageSize }),
            setPagination: ({ startRow, endRow }: { startRow: number, endRow: number }) => {
                setPagination({ pageIndex: Math.floor(startRow / table.getState().pagination.pageSize), pageSize: endRow - startRow })
            },
            getSorting: () => table.getState().sorting,
            setSorting: (newSorting: SortingState) => {
                // NOTE: If we change sorting, we need to reset pagination to the first page
                setPagination(prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })
                setSorting(newSorting)
            },
            getRowSelection: () => table.getSelectedRowModel().flatRows.map(row => row.id),
            resetRowSelection: () => {
                table.resetRowSelection()
            },
            refetchData: async () => {
                fetchData(true)
            },
        }

        const tableRef = { api }

        return tableRef
    }, [table, fetchData])

    return (
        <div className='condo-table-container'>
            <div className='condo-table-wrapper'>
                <div className='condo-table'>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableHeader<TData>
                            key={headerGroup.id}
                            headerGroup={headerGroup}
                            columns={orderedColumns}
                            columnLabels={columnLabels}
                            table={table}
                            resetSettings={resetSettings}
                        />
                    ))}
                    <TableBody<TData>
                        table={table} 
                        onRowClick={onRowClick} 
                        showSkeleton={internalLoading}
                        columnLabels={columnLabels}
                    />
                </div>
            </div>
            {table.getPageCount() > 1 && (
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