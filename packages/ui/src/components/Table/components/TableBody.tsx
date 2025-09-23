import { Table, flexRender, RowData } from '@tanstack/react-table'
import React from 'react'


export const TableBody = <TData extends RowData = RowData> ({ table, onRowClick }: { table: Table<TData>, onRowClick?: (record: TData) => void }) => {
    return (
        <div className='condo-table-tbody'>
            {table.getRowModel().rows.map(row => (
                <div
                    key={row.id}
                    className='condo-table-tr'
                    onClick={() => onRowClick?.(row.original)}
                    role={onRowClick ? 'button' : 'row'}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={(e) => {
                        if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault()
                            onRowClick(row.original)
                        }
                    }}
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
