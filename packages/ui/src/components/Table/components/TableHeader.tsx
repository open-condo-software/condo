import { flexRender } from '@tanstack/react-table'
import React from 'react'

import { MoreVertical, GripHorizontal, SortAsc, SortDesc, Filter } from '@open-condo/icons'
import { Space, Dropdown } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import { ColumnSettings } from './ColumnSettings'

import type { TableColumn } from '../types'

interface TableHeaderProps {
    headerGroup: {
        id: string
        headers: Array<{
            id: string
            column: {
                columnDef: { header: unknown }
                getCanResize: () => boolean
                getIsResizing: () => boolean
            }
            getContext: () => unknown
            getResizeHandler: () => () => void
        }>
    }
    columns: TableColumn[]
    table: {
        getColumn: (key: string) => { getIsVisible: () => boolean, toggleVisibility: (visible: boolean) => void } | undefined
        getVisibleLeafColumns: () => Array<{ getIsVisible: () => boolean }>
        setColumnOrder?: (columnOrder: string[]) => void
    }
}

export const TableHeader = ({ headerGroup, columns, table }: TableHeaderProps) => {
    const renderColumnSettings = () => (
        <ColumnSettings columns={columns} table={table} />
    )

    return (
        <tr key={headerGroup.id}>
            {headerGroup.headers.map((header, index: number) => {
                const isLastHeader = index === headerGroup.headers.length - 1

                return (
                    <th
                        key={header.id}
                        className='condo-table-th'
                        style={{ width: `var(--col-${header.id}-size)` }}
                    >
                        <div className='condo-table-th-content'>
                            <div className='condo-table-th-title-content'>
                                {flexRender(header.column.columnDef.header as any, header.getContext() as any)}
                            </div>
                            <Dropdown
                                menu={{ 
                                    items: [
                                        {
                                            label: (<span>Сортировать</span>),
                                            key: '1',
                                            icon: <SortDesc size='small' color={colors.gray[7]} />,
                                        },
                                        {
                                            label: (<span>Сортировать</span>),
                                            key: '2',
                                            icon: <SortAsc size='small' color={colors.gray[7]} />,
                                        },
                                        { type: 'divider' },
                                        {
                                            label: (<span>Фильтровать</span>),
                                            key: '3',
                                            icon: <Filter size='small' color={colors.gray[7]} />,
                                        },
                                        { type: 'divider' },
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
                                                        <span>Настроить колонки</span>
                                                    </Space>
                                                </Dropdown>
                                            ),
                                            key: '4',
                                        },
                                    ], 
                                }}
                                overlayClassName='condo-table-header-dropdown'
                            >
                                <div className='condo-table-th-more-icon'>
                                    <MoreVertical size='small' />
                                </div>
                            </Dropdown>
                        </div>
                        {header.column.getCanResize() && !isLastHeader && (
                            <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={`condo-table-resizer ${header.column.getIsResizing() ? 'is-resizing' : ''}`}
                            />
                        )}
                    </th>
                )
            })}
        </tr>
    )
}
