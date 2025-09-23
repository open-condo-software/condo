import {
    getCoreRowModel,
    useReactTable,
    RowData,
    CellContext,
    AccessorFn,
    createColumnHelper,
} from '@tanstack/react-table'
import React, { useMemo } from 'react'

import { TableBody } from '@open-condo/ui/src/components/Table/components/TableBody'
import { TableHeader } from '@open-condo/ui/src/components/Table/components/TableHeader'
import { useTableState } from '@open-condo/ui/src/components/Table/hooks/useTableState'
import type { TableColumn, TableProps } from '@open-condo/ui/src/components/Table/types'


export function Table<TData extends RowData = RowData> ({
    dataSource,
    columns,
    id,
    storageKey = `table-state-${id}`,
    columnMenuLabels = {},
    loading,
    onRowClick,
}: TableProps<TData>): React.ReactElement {

    const tableData = useMemo(() => dataSource, [dataSource])

    const columnHelper = createColumnHelper<TData>()
    const tableColumns = useMemo(() => {
        return columns.map(c => {
            return columnHelper.accessor(c.dataKey as AccessorFn<TData, unknown>, {
                id: c.id,
                header: c.header,
                cell: (info: CellContext<TData, unknown>) => c.render?.(info.getValue()) || info.getValue(),
            })
        })
    }, [columns, columnHelper])
    
    const {
        columnVisibility,
        columnOrder,
        onColumnVisibilityChange,
        onColumnOrderChange,
    } = useTableState<TData>({ storageKey, columns })

    const orderedColumns = useMemo(() => {
        if (columnOrder && columnOrder.length > 0) {
            const columnsById = new Map(columns.map(c => [String(c.id), c]))
            return columnOrder.map(key => columnsById.get(key)).filter((c): c is TableColumn<TData> => Boolean(c))
        }
        return columns
    }, [columns, columnOrder])

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
                            columnMenuLabels={columnMenuLabels}
                            table={table}
                        />
                    ))}
                </div>
                {loading ? (
                    <div className='condo-table-tbody'>
                        <div className='condo-table-loading' />
                    </div>
                ) : (
                    <TableBody<TData> table={table} onRowClick={onRowClick} />
                )}
            </div>
        </div>
    )
}
