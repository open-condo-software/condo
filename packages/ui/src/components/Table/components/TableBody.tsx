import { Table, flexRender, RowData } from '@tanstack/react-table'
import React, { useCallback } from 'react'


export const TableBody = <TData extends RowData = RowData> ({ table, onRowClick }: { table: Table<TData>, onRowClick?: (record: TData) => void }) => {
    const createKeyDownHandler = useCallback((row: { original: TData }) => (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onRowClick(row.original)
        }
    }, [onRowClick])
    
    return (
        <div className='condo-table-tbody'>
            {table.getRowModel().rows.map(row => (
                <div
                    key={row.id}
                    className='condo-table-tr'
                    onClick={() => onRowClick?.(row.original)}
                    role={onRowClick ? 'button' : 'row'}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={createKeyDownHandler(row)}
                    aria-label={onRowClick ? `Select row ${row.id}` : undefined}
                >
                    {row.getVisibleCells().map(cell => (
                        <div
                            key={cell.id}
                            className='condo-table-td'
                        >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}
