import { flexRender, HeaderGroup, RowData, Table } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import { 
    MoreVertical, 
    GripHorizontal, 
    SortAsc, 
    SortDesc, 
    Filter, 
} from '@open-condo/icons'
import { Space, Dropdown } from '@open-condo/ui/src'
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

    const columnContextMenu = useMemo(() => [
        columnMenuLabels?.sortLabel && {
            label: (<span>{columnMenuLabels.sortLabel}</span>),
            key: '1',
            icon: <SortDesc size='small' color={colors.gray[7]} />,
        },
        columnMenuLabels?.sortLabel && {
            label: (<span>{columnMenuLabels.sortLabel}</span>),
            key: '2',
            icon: <SortAsc size='small' color={colors.gray[7]} />,
        },
        columnMenuLabels?.sortLabel && { type: 'divider' as const },
        columnMenuLabels?.filterLabel && {
            label: (<span>{columnMenuLabels.filterLabel}</span>),
            key: '3',
            icon: <Filter size='small' color={colors.gray[7]} />,
        },
        columnMenuLabels?.filterLabel && { type: 'divider' as const },
        columnMenuLabels?.settingsLabel && {
            label: (
                <Dropdown
                    align={{
                        points: ['cl', 'cr'],
                        offset: [8, 0],
                    }}
                    dropdownRender={renderColumnSettings}
                >
                    <Space size={8}>
                        <span>{columnMenuLabels.settingsLabel}</span>
                    </Space>
                </Dropdown>
            ),
            key: '4',
            icon: <GripHorizontal size='small' color={colors.gray[7]} />,
        },
    ].filter(Boolean), [renderColumnSettings, columnMenuLabels])

    return (
        <div key={headerGroup.id} className='condo-table-thead-row'>
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
                                columnContextMenu.length > 0 && (<Dropdown
                                    menu={{ 
                                        items: columnContextMenu,
                                    }}
                                    overlayClassName='condo-table-header-dropdown'
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
