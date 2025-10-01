import { flexRender, HeaderGroup, RowData, Table } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import { 
    MoreVertical, 
    GripHorizontal, 
    SortAsc, 
    SortDesc, 
    Filter, 
} from '@open-condo/icons'
import { Dropdown, Space } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import { ColumnSettings } from './ColumnSettings'


import type { TableColumn, TableColumnMenuLabels } from '../types'

interface TableHeaderProps<TData extends RowData = RowData> {
    headerGroup: HeaderGroup<TData>
    columns: TableColumn<TData>[]
    columnMenuLabels: TableColumnMenuLabels
    table: Table<TData>
}

export const TableHeader = <TData extends RowData = RowData>({ headerGroup, columns, table, columnMenuLabels }: TableHeaderProps<TData>) => {
    const renderColumnSettings = useCallback(() => (
        <ColumnSettings columns={columns} table={table} />
    ), [columns, table])

    const columnMenu = useMemo(() => {
        return [
            {
                label: <span>{columnMenuLabels?.sortLabel}</span>,
                key: 'sort-desc',
                icon: <SortDesc size='small' color={colors.gray[7]} />,
            },
            {
                label: <span>{columnMenuLabels?.sortLabel}</span>,
                key: 'sort-asc',
                icon: <SortAsc size='small' color={colors.gray[7]} />,
            },
            { type: 'divider' as const },
            {
                label: <span>{columnMenuLabels?.filterLabel}</span>,
                key: 'filter',
                icon: <Filter size='small' color={colors.gray[7]} />,
            },
            { type: 'divider' as const },
            {
                label: (
                    <Dropdown
                        align={{
                            points: ['cl', 'cr'],
                            offset: [8, 0],
                        }}
                        dropdownRender={renderColumnSettings}
                    >
                        <Space size={8}>
                            <GripHorizontal size='small' color={colors.gray[7]} />
                            <span>{columnMenuLabels.settingsLabel}</span>
                        </Space>
                    </Dropdown>
                ),
                key: 'settings',
            },
        ]
    }, [renderColumnSettings, columnMenuLabels])

    return (
        <div key={headerGroup.id} className='condo-table-thead'>
            {headerGroup.headers.map((header) => {

                return (
                    <div
                        key={header.id}
                        className='condo-table-th'
                    >
                        <div className='condo-table-th-content'>
                            <div className='condo-table-th-title-content'>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                            {
                                columnMenu.length > 0 && (<Dropdown
                                    menu={{ 
                                        items: columnMenu,
                                    }}
                                >
                                    <div className='condo-table-th-more-icon'>
                                        <MoreVertical size='small' />
                                    </div>
                                </Dropdown>)
                            }
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
