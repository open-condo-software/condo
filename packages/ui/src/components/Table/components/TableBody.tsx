import { Table, flexRender, RowData } from '@tanstack/react-table'
import React from 'react'


export const TableBody = <TData extends RowData = RowData> ({ table, onRowClick }: { table: Table<TData>, onRowClick?: (record: TData) => void }) => {
    return (
        <div className='condo-table-tbody'>
            {table.getRowModel().rows.map(row => (
                <div
                    key={row.id}
                    className='condo-table-tr'
                    onClick={() => onRowClick && onRowClick(row.original)}
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
