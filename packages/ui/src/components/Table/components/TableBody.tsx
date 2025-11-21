import { Table, flexRender, RowData } from '@tanstack/react-table'
import React, { useCallback } from 'react'

import { Inbox } from '@open-condo/icons'
import { colors } from '@open-condo/ui/src/colors'
import type { 
    TableColumnMenuLabels, 
} from '@open-condo/ui/src/components/Table/types'

type TableBodyProps<TData extends RowData = RowData> = {
    table: Table<TData>
    onRowClick?: (record: TData) => void
    showSkeleton?: boolean
    columnMenuLabels?: TableColumnMenuLabels
}


export function TableBody <TData extends RowData = RowData> ({ 
    table, 
    onRowClick, 
    showSkeleton,
    columnMenuLabels = {},
}: TableBodyProps<TData>) {
    const createKeyDownHandler = useCallback((row: { original: TData }) => (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onRowClick(row.original)
        }
    }, [onRowClick])

    const rows = table.getRowModel().rows

    if (showSkeleton && rows.length === 0) {
        return (
            <div className='condo-table-tbody'>
                <div className='condo-table-loading' />
            </div>
        )
    }

    if (!showSkeleton && rows.length === 0) {
        return (
            <div className='condo-table-tbody'>
                <div className='condo-table-empty'>
                    <Inbox color={colors.gray[7]} />
                    <div className='condo-table-empty-content'>
                        {columnMenuLabels?.noData}
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className='condo-table-tbody'>
            {rows.map(row => (
                <div
                    key={row.id}
                    className='condo-table-tr'
                    onClick={() => onRowClick?.(row.original)}
                    role={onRowClick ? 'button' : 'row'}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={createKeyDownHandler(row)}
                    aria-label={onRowClick ? `Select row ${row.id}` : undefined}
                >
                    {row.getVisibleCells().map(cell => {

                        return (
                            <div
                                key={cell.id}
                                className='condo-table-td'
                                style={{ 
                                    width: cell.column.getSize(),
                                }}
                            >
                                {showSkeleton ? <div className='condo-table-cell-skeleton' /> : flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
