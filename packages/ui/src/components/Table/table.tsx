import {
    Cell,
    ColumnDef,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    Table as ReactTable,
    useReactTable,
} from '@tanstack/react-table'
import debounce from 'lodash/debounce'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { TableHeader } from './components/TableHeader'
import { useColumnOrder } from './hooks/useColumnOrder'
import { useColumnSizing } from './hooks/useColumnSizing'
import { useColumnVisibility } from './hooks/useColumnVisibility'
import { getStorage, saveStorage } from './storage'
import { calculateInitialColumnSizes, calculateColumnSizeVars } from './utils/columnSizing'

import type { TableSettings, TableColumn } from './types'

interface UsePersistentTableStateProps {
    storageKey: string
    columns: Array<TableColumn>
    containerWidth?: number
}

const useTableState = ({ storageKey, columns, containerWidth }: UsePersistentTableStateProps) => {
    const getInitialState = useCallback((): TableSettings => {
        const savedState = getStorage(storageKey)

        if (savedState) {
            return savedState
        }

        const orderedColumns: (TableColumn | null)[] = new Array(columns.length).fill(null)
        const unorderedColumns: TableColumn[] = []

        for (const col of columns) {
            if (col.initialOrder !== undefined && col.initialOrder < columns.length && !orderedColumns[col.initialOrder]) {
                orderedColumns[col.initialOrder] = col
            } else {
                unorderedColumns.push(col)
            }
        }

        const finalColumns = orderedColumns.map(c => c || unorderedColumns.shift())

        // Compute initial sizes using utility function
        const sizesByKey = calculateInitialColumnSizes({
            columns: finalColumns.filter((c): c is TableColumn => Boolean(c)),
            containerWidth,
        })

        const result: TableSettings = {} as TableSettings
        finalColumns.forEach(column => {
            if (column) {
                result[column.key] = {
                    order: finalColumns.indexOf(column),
                    visibility: column.initialVisibility ?? true,
                    size: sizesByKey[column.key],
                }
            }
        })
        return result
    }, [columns, containerWidth, storageKey])

    const [settings, setSettings] = useState<TableSettings>(getInitialState)

    const debouncedSave = useMemo(
        () => debounce((state: TableSettings) => saveStorage(storageKey, state), 300),
        [storageKey]
    )

    useEffect(() => {
        debouncedSave(settings)
    }, [settings, debouncedSave])

    // Используем специализированные хуки
    const { columnSizing, onColumnSizingChange, saveColumnSizingAsPercentages } = useColumnSizing({
        settings,
        setSettings,
        containerWidth,
    })

    const { columnVisibility, onColumnVisibilityChange } = useColumnVisibility({
        settings,
        setSettings,
    })

    const { columnOrder, onColumnOrderChange } = useColumnOrder({
        settings,
        setSettings,
    })

    return {
        columnVisibility,
        columnOrder,
        columnSizing,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
        saveColumnSizingAsPercentages,
    }
}


export interface TableProps {
    dataSource: Array<Record<string, unknown>>
    columns: Array<TableColumn>
    storageKey?: string
    loading?: boolean
    onRow?: (record: Record<string, unknown>) => void
}

const MemoizedCellContent = React.memo(
    function MemoizedCellContent ({ cell }: { cell: Cell<Record<string, unknown>, unknown> }) {
        return <>{flexRender(cell.column.columnDef.cell, cell.getContext())}</>
    },
    (prev, next) => prev.cell.row.original === next.cell.row.original
)

function TableBody ({ table, onRow }: { table: ReactTable<Record<string, unknown>>, onRow?: (record: Record<string, unknown>) => void }) {
    return (
        <tbody className='condo-table-tbody'>
            {table.getRowModel().rows.map(row => (
                <tr
                    key={row.id}
                    className='condo-table-tr'
                    onClick={() => onRow && onRow(row.original)}
                >
                    {row.getVisibleCells().map(cell => (
                        <td
                            key={cell.id}
                            className='condo-table-td'
                            style={{ width: `var(--col-${cell.column.id}-size)` }}
                        >
                            <MemoizedCellContent cell={cell} />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    )
}

const MemoizedTableBody = React.memo(
    TableBody,
    (prev, next) => prev.table.options.data === next.table.options.data
) as typeof TableBody

export function Table ({
    dataSource,
    columns,
    storageKey = 'table-state',
    loading,
    onRow,
}: TableProps): React.ReactElement {
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined)

    useEffect(() => {
        if (!containerRef.current) return
        const element = containerRef.current
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) {
                const width = Math.floor(entry.contentRect.width)
                if (width !== containerWidth) {
                    setContainerWidth(width)
                }
            }
        })
        observer.observe(element)
        return () => observer.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const {
        columnVisibility: tableColumnVisibility,
        columnOrder,
        columnSizing: persistedColumnSizing,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
    } = useTableState({ storageKey, columns, containerWidth })

    const sortedColumns = useMemo(() => {
        if (columnOrder && columnOrder.length > 0) {
            const columnsByKey = new Map(columns.map(c => [c.key, c]))
            return columnOrder.map(key => columnsByKey.get(key)).filter((c): c is TableColumn => Boolean(c))
        }
        return columns
    }, [columns, columnOrder])

    const data = useMemo(() => dataSource, [dataSource])

    const columnHelper = createColumnHelper<Record<string, unknown>>()

    const columnsDefinitions = useMemo(() =>
        columns.map(column =>
            columnHelper.accessor(column.key as keyof Record<string, unknown>, {
                id: column.key,
                header: column.header as ColumnDef<Record<string, unknown>>['header'],
                cell: (info) => info.getValue(),
                ...column,
            })
        ), [columns, columnHelper])

    const table = useReactTable({
        data: data || [],
        columns: columnsDefinitions,
        getCoreRowModel: getCoreRowModel(),
        state: {
            columnVisibility: tableColumnVisibility,
            columnSizing: persistedColumnSizing,
            columnOrder,
        },
        onColumnSizingChange: (updater) => onColumnSizingChange(updater, table),
        onColumnVisibilityChange: onColumnVisibilityChange,
        onColumnOrderChange: onColumnOrderChange,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
    })

    const columnSizeVars = useMemo(() => {
        return calculateColumnSizeVars(table)
    }, [table])

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div
            ref={containerRef}
            className='condo-table-container'
            style={{
                ...columnSizeVars,
            }}
        >
            <table className='condo-table'>
                <thead className='condo-table-thead'>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableHeader
                            key={headerGroup.id}
                            headerGroup={headerGroup}
                            columns={sortedColumns}
                            table={{
                                ...table,
                                setColumnOrder: onColumnOrderChange,
                            }}
                        />
                    ))}
                </thead>
                {table.getState().columnSizingInfo.isResizingColumn ? (
                    <MemoizedTableBody table={table} onRow={onRow} />
                ) : (
                    <TableBody table={table} onRow={onRow} />
                )}
            </table>
        </div>
    )
}