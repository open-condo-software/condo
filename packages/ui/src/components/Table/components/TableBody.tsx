import { Table, flexRender, RowData } from '@tanstack/react-table'
import React, { useCallback } from 'react'
import { createPortal } from 'react-dom'

import { Inbox } from '@open-condo/icons'
import type { 
    TableLabels, 
} from '@open-condo/ui/src/components/Table/types'

type TableBodyProps<TData extends RowData = RowData> = Readonly<{
    table: Table<TData>
    onRowClick?: (record: TData) => void
    dataLoading: boolean
    columnLabels: TableLabels
    tableContainerRef: React.RefObject<HTMLDivElement> | null
}>


export function TableBody <TData extends RowData = RowData> ({ 
    table, 
    onRowClick, 
    dataLoading,
    columnLabels,
    tableContainerRef,
}: TableBodyProps<TData>) {
    const createKeyDownHandler = useCallback((row: { original: TData }) => (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onRowClick(row.original)
        }
    }, [onRowClick])

    const rows = table.getRowModel().rows
    const renderLoadingOverlay = useCallback(() => {
        if (!tableContainerRef?.current) return null

        return createPortal(
            <div className='condo-table-loading-overlay'>
                <div className='condo-table-loading-spinner' />
            </div>,
            tableContainerRef.current
        )
    }, [tableContainerRef])

    if (rows.length === 0) {

        return (
            dataLoading ? (
                <>
                    <div className='condo-table-tbody'>
                        <div className='condo-table-loading-placeholder' />
                    </div>
                    {renderLoadingOverlay()}
                </>
            ) : 
                <div className='condo-table-tbody'>
                    <div className='condo-table-empty'>
                        <Inbox className='condo-table-icon condo-table-icon-gray condo-table-empty-icon' />
                        <div className='condo-table-empty-content'>
                            {columnLabels?.noDataLabel ?? 'No data'}
                        </div>
                    </div>
                </div>
        )
    }
    
    return (
        <>
            <div className='condo-table-tbody'>
                {rows.map(row => (
                    <div
                        key={row.id}
                        className='condo-table-tr'
                        role={onRowClick ? 'button' : undefined}
                        tabIndex={onRowClick ? 0 : undefined}
                        onClick={() => onRowClick?.(row.original)}
                        onKeyDown={createKeyDownHandler(row)}
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
                                    {dataLoading ? <div className='condo-table-cell-skeleton' /> : flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </>
    )
}
