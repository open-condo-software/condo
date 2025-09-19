import {
    getCoreRowModel,
    useReactTable,
    RowData,
    CellContext,
} from '@tanstack/react-table'
import React, { useEffect, useMemo } from 'react'

import { TableBody } from '@open-condo/ui/src/components/Table/components/TableBody'
import { TableHeader } from '@open-condo/ui/src/components/Table/components/TableHeader'
import { useTableState } from '@open-condo/ui/src/components/Table/hooks/useTableState'
import type { TableColumn, TableProps } from '@open-condo/ui/src/components/Table/types'

const MemoizedTableBody = React.memo(
    TableBody,
    (prev, next) => prev.table.options.data === next.table.options.data
) as typeof TableBody

export function Table<TData extends RowData = RowData> ({
    dataSource,
    columns,
    id,
    storageKey = `table-state-${id}`,
    loading,
    onRowClick,
}: TableProps<TData>): React.ReactElement {
    const {
        columnVisibility,
        columnOrder,
        columnSizing,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
    } = useTableState<TData>({ storageKey, columns })

    const orderedColumns = useMemo(() => {
        if (columnOrder && columnOrder.length > 0) {
            const columnsByKey = new Map(columns.map(c => [String(c.dataKey), c]))
            return columnOrder.map(key => columnsByKey.get(key)).filter((c): c is TableColumn<TData> => Boolean(c))
        }
        return columns
    }, [columns, columnOrder])

    const tableData = useMemo(() => dataSource, [dataSource])

    const tableColumns = useMemo(() => {
        return columns.map(c => ({
            header: c.header,
            accessorKey: c.dataKey,
            cell: (info: CellContext<TData, unknown>) => c.render?.(info.getValue() as TData[keyof TData]) || info.getValue(),
        }))
    }, [columns])

    const table = useReactTable<TData>({
        data: tableData,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        state: {
            columnVisibility,
            columnOrder,
        },
        onColumnVisibilityChange: onColumnVisibilityChange,
        onColumnOrderChange: onColumnOrderChange,
    })

    useEffect(() => {
        const headers = table.getFlatHeaders()
        headers.forEach(header => {
            const size = columnSizing[header.id]
            const elements = document.querySelectorAll(`[data-column-id="${header.id}"]`)
            
            if (size && size > 0) {
                // Устанавливаем конкретный размер
                elements.forEach(element => {
                    const el = element as HTMLElement
                    el.style.width = `${size}px`
                    el.style.minWidth = `${size}px`
                })
            } else {
                // Сбрасываем к автоматическому размеру
                elements.forEach(element => {
                    const el = element as HTMLElement
                    el.style.width = ''
                    el.style.minWidth = ''
                })
            }
        })
    }, [table, columnSizing])


    return (
        <div
            className='condo-table-container'
        >
            <div className='condo-table'>
                <div className='condo-table-thead'>
                    {table.getHeaderGroups().map(headerGroup => (
                        <TableHeader<TData>
                            key={headerGroup.id}
                            headerGroup={headerGroup}
                            columns={orderedColumns}
                            table={table}
                            onColumnSizingChange={onColumnSizingChange}
                        />
                    ))}
                </div>
                {loading ? (
                    <div className='condo-table-tbody'>
                        <div className='condo-table-loading' />
                    </div>
                ) : (
                    table.getState().columnSizingInfo.isResizingColumn ? (
                        <MemoizedTableBody<TData> table={table} onRowClick={onRowClick} />
                    ) : (
                        <TableBody<TData> table={table} onRowClick={onRowClick} />
                    ) 
                )}
            </div>
        </div>
    )
}
