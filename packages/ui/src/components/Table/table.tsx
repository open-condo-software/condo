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
    Updater,
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
} from '@open-condo/ui/src/components/Table/constants'
import { useTableSetting } from '@open-condo/ui/src/components/Table/hooks/useTableSetting'
import type { 
    TableProps, 
    FilterState, 
    TableRef,
    TableApi,
    FilterComponent,
    TableColumnMeta,
    ColumnDefWithId,
    FullTableState,
} from '@open-condo/ui/src/components/Table/types'
import '@open-condo/ui/src/components/Table/types'
import { getFilterComponentByKey } from '@open-condo/ui/src/components/Table/utils/filterComponents'
import { renderTextWithTooltip } from '@open-condo/ui/src/components/Table/utils/renderCellUtils'

import type { CheckboxChangeEvent } from 'antd/lib/checkbox'

function getPageIndexFromStartRow (startRow: number, pageSize: number): number {
    return Math.floor(startRow / pageSize)
}

type SelectionCheckboxProps = {
    checked: boolean
    indeterminate?: boolean
    disabled?: boolean
    onChange: (event: CheckboxChangeEvent) => void
}

function SelectionCheckbox ({ checked, disabled, indeterminate, onChange }: SelectionCheckboxProps) {
    return (
        <span 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            role='button'
        >
            <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                disabled={disabled}
                onChange={onChange}
            />
        </span>
    )
}

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
        initialTableState = { filterState: {}, startRow: 0, endRow: pageSize, sortState: [], rowSelectionState: [], globalFilter: undefined },
        storageKey = `table-settings-${id}`,
        columnLabels = {},
        onRowClick,
        rowSelectionOptions,
        onTableReady,
        getRowId,
    } = props

    const [globalFilter, setGlobalFilter] = useState<string | undefined>(initialTableState.globalFilter)
    const columnHelper = createColumnHelper<TData>()
    const tableColumns = useMemo(() => {
        const resultColumns: ColumnDefWithId<TData>[] = []
        if (rowSelectionOptions?.enableRowSelection) {
            resultColumns.push(columnHelper.display({
                id: COLUMN_ID_SELECTION,
                header: ({ table }) => (
                    <SelectionCheckbox
                        checked={table.getIsAllRowsSelected()}
                        indeterminate={table.getIsSomeRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                    />
                ),
                cell: ({ row }) => (
                    <SelectionCheckbox
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                ),
                minSize: 48,
                enableSorting: false,
                enableColumnFilter: false,
                meta: {
                    enableColumnSettings: false,
                    enableColumnMenu: false,
                    enableColumnResize: false,
                    initialVisibility: true,
                    initialSize: 48,
                    initialOrder: 0,
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
            const colCell = (info: CellContext<TData, unknown>) => c.render?.(info.getValue(), info.row.original, info.row.index, globalFilter) ?? renderTextWithTooltip()(info.getValue())
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
            const enableSorting = c.enableSorting ?? (defaultColumn?.enableSorting ?? true)
            const enableColumnResize = c.enableColumnResize ?? (defaultColumn?.enableColumnResize ?? true)
            const enableColumnMenu = enableSorting || enableColumnFilter || enableColumnSettings
            const colMinSize = c.minSize ?? (defaultColumn?.minSize ?? DEFAULT_MIN_SIZE)
            const initialSize = c.initialSize ?? (defaultColumn?.initialSize ?? undefined)
            const initialVisibility = c.initialVisibility ?? (defaultColumn?.initialVisibility ?? true)
            const initialOrder = c.initialOrder
            const meta: TableColumnMeta = {
                filterComponent,
                enableColumnSettings,
                enableColumnMenu,
                enableColumnResize,
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
    }, [columns, columnHelper, defaultColumn, rowSelectionOptions?.enableRowSelection, globalFilter])

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

    const onTableStateChangeRef = useRef(onTableStateChange)
    
    useEffect(() => {
        onTableStateChangeRef.current = onTableStateChange
    }, [onTableStateChange])

    const handleTableStateChange = useCallback(async () => {
        if (!onTableStateChangeRef.current) return
        const startRow = pagination.pageIndex * pagination.pageSize
        const endRow = startRow + pagination.pageSize
        const filterState = columnFilters.reduce((acc, filter) => {
            acc[filter.id] = filter.value
            return acc
        }, {} as FilterState)

        onTableStateChangeRef.current({
            startRow,
            endRow,
            filterState,
            sortState: sorting,
            globalFilter,
            rowSelectionState: Object.keys(rowSelection),
        })
    }, [pagination, columnFilters, sorting, globalFilter, rowSelection, onTableStateChangeRef])

    // NOTE: This effect should be first, because if we have error in this effect, we don't want to change the table state and fetch new data
    useEffect(() => {
        handleTableStateChange()
    }, [handleTableStateChange])

    const dataSourceRef = useRef(dataSource)
    
    useEffect(() => {
        dataSourceRef.current = dataSource
    }, [dataSource])
    
    const fetchData = useCallback(async (isRefetch: boolean = false) => {
        setInternalLoading(true)
        const startRow = pagination.pageIndex * pagination.pageSize
        const endRow = startRow + pagination.pageSize
        const filterState = columnFilters.reduce((acc, filter) => {
            acc[filter.id] = filter.value
            return acc
        }, {} as FilterState)

        try {
            const { rowData, rowCount } = await dataSourceRef.current({
                startRow,
                endRow,
                filterState,
                sortState: sorting,
                globalFilter,
            }, isRefetch)
            setTableData(rowData)
            setRowCount(rowCount)
        } catch (error) {
            setTableData([])
            setRowCount(0)
        } finally {
            setInternalLoading(false)
        }
    }, [pagination, columnFilters, sorting, globalFilter])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handlePaginationChange = useCallback((updaterOrValue: Updater<PaginationState>) => {
        setPagination(prev => {
            const newPagination = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
            return newPagination
        })
    }, [])

    const handleRowSelectionChange = useCallback((updaterOrValue: Updater<RowSelectionState>) => {
        setRowSelection(prev => {
            const newRowSelection = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
            if (rowSelectionOptions?.onRowSelectionChange) {
                rowSelectionOptions.onRowSelectionChange(Object.keys(newRowSelection))
            }
            return newRowSelection
        })
    }, [rowSelectionOptions])

    const handleSortingChange = useCallback((updaterOrValue: Updater<SortingState>) => {
        // NOTE: If we change sorting, we need to reset pagination to the first page and reset row selection
        handlePaginationChange({ pageIndex: 0, pageSize: pagination.pageSize })
        handleRowSelectionChange({})
        setSorting(prev => {
            const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
        
            const validatedSorting = newSorting.filter(sortItem => {
                const column = tableColumns.find(col => col.id === sortItem.id)
                if (!column) return false
                
                return column.enableSorting !== false
            })
            return validatedSorting
        })
    }, [handlePaginationChange, handleRowSelectionChange, pagination.pageSize, tableColumns])
    
    const handleColumnFiltersChange = useCallback((updaterOrValue: Updater<ColumnFiltersState>) => {
        // NOTE: If we change column filters, we need to reset pagination to the first page and reset row selection
        handlePaginationChange({ pageIndex: 0, pageSize: pagination.pageSize })
        handleRowSelectionChange({})

        setColumnFilters(prev => {
            const newFilters = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue

            const filteredFilters = newFilters.filter(filter => {
                const column = tableColumns.find(col => col.id === filter.id)
                if (!column?.enableColumnFilter) return false
    
                const value = filter.value
                if (value === null || value === undefined) return false
                if (typeof value === 'string') return value.trim() !== ''
                if (Array.isArray(value)) return value.length > 0
                if (typeof value === 'object') return Object.keys(value).length > 0
                return true
            })
            return filteredFilters
        })
    }, [handlePaginationChange, handleRowSelectionChange, pagination.pageSize, tableColumns])

    const handleGlobalFilterChange = useCallback((updaterOrValue: Updater<string | undefined>) => {
        // NOTE: If we change global filter, we need to reset pagination to the first page and reset row selection
        handlePaginationChange({ pageIndex: 0, pageSize: pagination.pageSize })
        handleRowSelectionChange({})
        setGlobalFilter(prev => {
            const newGlobalFilter = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue
            return newGlobalFilter
        })
    }, [handlePaginationChange, handleRowSelectionChange, pagination.pageSize])

    const table = useReactTable<TData>({
        data: tableData,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: handleColumnFiltersChange,
        onRowSelectionChange: handleRowSelectionChange,
        onGlobalFilterChange: handleGlobalFilterChange,
        onPaginationChange: handlePaginationChange,
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
            globalFilter,
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
        defaultColumn: {
            filterFn: 'equals',
        },
    })

    const onTableReadyRef = useRef<((tableRef: TableRef) => void) | undefined>(onTableReady)

    useEffect(() => {
        if (onTableReadyRef.current && ref && 'current' in ref && ref.current) {
            const fn = onTableReadyRef.current
            onTableReadyRef.current = undefined
            fn(ref.current)
        }
    }, [ref])

    useImperativeHandle(ref, () => {
        const api: TableApi = {
            getFilterState: () => {
                return table.getState().columnFilters.reduce((acc, filter) => { acc[filter.id] = filter.value; return acc }, {} as FilterState)
            },
            setFilterState: (newFilterState: FilterState) => {
                // NOTE: If we change filter state, we need to reset pagination to the first page and reset row selection
                setPagination(prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })
                table.resetRowSelection()
                const newFilter = ([key, value]: [string, unknown]): ColumnFiltersState[number] => ({ id: key, value: value })
                setColumnFilters(() => {
                    return [...Object.entries(newFilterState).map(newFilter).filter(Boolean)] as ColumnFiltersState
                })
            },
            getColumnFilter: (columnId: string) => table.getState().columnFilters.find(filter => filter.id === columnId)?.value,
            setColumnFilter: (columnId: string, value: unknown) => {
                // NOTE: If we change column filter, we need to reset pagination to the first page and reset row selection
                setPagination(prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })
                table.resetRowSelection()
                const findIndex = (filter: ColumnFiltersState[number]) => filter.id === columnId
                setColumnFilters((prev) => {                    
                    const existingFilterIndex = prev.findIndex(findIndex)
                    if (existingFilterIndex >= 0) {
                        const newFilters = [...prev]
                        newFilters[existingFilterIndex] = { id: columnId, value: value }
                        return newFilters
                    } else {
                        return [...prev, { id: columnId, value: value }]
                    }
                })
            },
            getGlobalFilter: () => table.getState().globalFilter,
            setGlobalFilter: (newGlobalFilter: string | undefined) => {
                // NOTE: If we change global filter, we need to reset pagination to the first page and reset row selection
                setPagination(prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })
                table.resetRowSelection()
                setGlobalFilter(newGlobalFilter)
            },
            getPagination: () => ({ startRow: table.getState().pagination.pageIndex * table.getState().pagination.pageSize, endRow: table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getState().pagination.pageSize }),
            setPagination: ({ startRow, endRow }: { startRow: number, endRow: number }) => {
                setPagination({ pageIndex: Math.floor(startRow / table.getState().pagination.pageSize), pageSize: endRow - startRow })
            },
            getSorting: () => table.getState().sorting,
            setSorting: (newSorting: SortingState) => {
                // NOTE: If we change sorting, we need to reset pagination to the first page and reset row selection
                setPagination(prev => prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 })
                table.resetRowSelection()
                setSorting(newSorting)
            },
            getRowSelection: () => table.getSelectedRowModel().flatRows.map(row => row.id),
            resetRowSelection: () => {
                table.resetRowSelection()
            },
            refetchData: async () => {
                await fetchData(true)
            },
            getFullTableState: () => ({
                startRow: table.getState().pagination.pageIndex * table.getState().pagination.pageSize,
                filterState: table.getState().columnFilters.reduce((acc, filter) => {
                    acc[filter.id] = filter.value
                    return acc
                }, {} as FilterState),
                sortState: table.getState().sorting,
                rowSelectionState: table.getSelectedRowModel().flatRows.map(row => row.id),
                globalFilter: table.getState().globalFilter,
            }),
            setFullTableState: (tableState: FullTableState) => {
                setPagination({ pageIndex: getPageIndexFromStartRow(tableState.startRow, pageSize), pageSize: pageSize })
                setColumnFilters(Object.entries(tableState.filterState).map(([key, value]) => ({ id: key, value: value })))
                setSorting(tableState.sortState)
                setGlobalFilter(tableState.globalFilter)
                setRowSelection(tableState.rowSelectionState.reduce((acc, selectedRow) => {
                    acc[selectedRow] = true
                    return acc
                }, {} as RowSelectionState))
            },
        }

        const tableRef = { api }

        return tableRef
    }, [table, fetchData, pageSize])

    const tableContainerRef = useRef<HTMLDivElement>(null)

    return (
        <div className='condo-table-container' ref={tableContainerRef}>
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
                        dataLoading={internalLoading}
                        columnLabels={columnLabels}
                        tableContainerRef={tableContainerRef}
                    />
                </div>
            </div>
            <TablePagination<TData> table={table} />
        </div>
    )
}

export const Table = forwardRef(TableComponent) as <TData extends RowData = RowData>(
    props: TableProps<TData> & { ref?: React.Ref<TableRef> }
) => React.ReactElement
