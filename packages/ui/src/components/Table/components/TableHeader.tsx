import { flexRender, HeaderGroup, RowData, Table, CoreHeader } from '@tanstack/react-table'
import React, { useCallback } from 'react'

import { 
    MoreVertical, 
    GripHorizontal, 
    SortAsc, 
    SortDesc, 
    Filter, 
    Close,
} from '@open-condo/icons'
import { Dropdown, Space } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import { ColumnSettings } from './ColumnSettings'

import type { TableColumn, TableColumnMenuLabels, TableColumnMeta } from '../types'

interface TableHeaderProps<TData extends RowData = RowData> {
    headerGroup: HeaderGroup<TData>
    columns: TableColumn<TData>[]
    columnMenuLabels: TableColumnMenuLabels
    table: Table<TData>
}

export function TableHeader <TData extends RowData = RowData> ({ 
    headerGroup, 
    columns, 
    table, 
    columnMenuLabels,
}: TableHeaderProps<TData>) {

    const renderColumnSettings = useCallback(() => (
        <ColumnSettings columns={columns} table={table} />
    ), [columns, table])

    const getColumnMenu = useCallback((header: CoreHeader<TData, unknown>) => {
        const columnMenu = []
        const sortingColumnMenuItems = [
            {
                className: header.column.getIsSorted() === 'desc' && 'condo-dropdown-menu-item-active',
                label: header.column.getIsSorted() === 'desc' ? <div className='condo-dropdown-menu-item-inner'>{columnMenuLabels?.sortedDescLabel} <Close size='small' /></div> : <div>{columnMenuLabels?.sortDescLabel}</div>,
                key: 'sort-desc',
                icon: <SortDesc size='small' />,
                onClick: () => (header.column.getIsSorted() === 'desc' ? header.column.clearSorting() : header.column.toggleSorting(true, true)),
            },
            {
                className: header.column.getIsSorted() === 'asc' && 'condo-dropdown-menu-item-active',
                label: header.column.getIsSorted() === 'asc' ? <div className='condo-dropdown-menu-item-inner'>{columnMenuLabels?.sortedAscLabel} <Close size='small' /></div>  : <div>{columnMenuLabels?.sortAscLabel}</div>,
                key: 'sort-asc',
                icon: <SortAsc size='small' />,
                onClick: () => (header.column.getIsSorted() === 'asc' ? header.column.clearSorting() : header.column.toggleSorting(false, true)),
            },
            { type: 'divider' as const },
        ]

        const filterComponent = (header.column.columnDef.meta as TableColumnMeta)?.filterComponent

        const filterColumnMenuItems = [
            {
                className: header.column.getIsFiltered() === true && 'condo-dropdown-menu-item-active',
                label: (
                    <Dropdown
                        align={{
                            points: ['cl', 'cr'],
                            offset: [8, 0],
                        }}
                        dropdownRender={filterComponent ? () => filterComponent({ 
                            setFilterValue: header.column.setFilterValue, 
                            filterValue: header.column.getFilterValue(),
                        }) : undefined}
                    >
                        <Space size={8}>
                            <Filter size='small' />
                            {header.column.getIsFiltered() === true ? <span className='condo-dropdown-menu-item-inner'>{columnMenuLabels.filteredLabel} <Close size='small' /></span> : <div>{columnMenuLabels?.filterLabel}</div>}
                        </Space> 
                    </Dropdown>
                ),
                key: 'filter',
                onClick: () => (header.column.getIsFiltered() === true && header.column.setFilterValue(undefined)),
            },
            { type: 'divider' as const },
        ]

        const settingColumnMenuItem = {
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
        }

        if (header.column.getCanSort()) {
            columnMenu.push(...sortingColumnMenuItems)
        }

        if (header.column.getCanFilter()) {
            columnMenu.push(...filterColumnMenuItems)
        }

        if ((header.column.columnDef.meta as TableColumnMeta)?.enableColumnSettings) {
            columnMenu.push(settingColumnMenuItem)
        }

        return columnMenu
    }, [renderColumnSettings, columnMenuLabels])

    return (
        <div key={headerGroup.id} className='condo-table-thead'>
            {headerGroup.headers.map((header) => {
                const isResizing = header.column.getIsResizing()
                const deltaOffset = table.getState().columnSizingInfo.deltaOffset ?? 0
                
                return (
                    <div
                        key={header.id}
                        className={`condo-table-th ${
                            header.column.getIsSorted() || header.column.getIsFiltered() 
                                ? 'condo-table-th-active' 
                                : ''
                        } ${isResizing ? 'condo-table-th-resizing' : ''}`}
                        style={{ 
                            width: header.getSize(),
                            transform: isResizing ? `translateX(${deltaOffset}px)` : '',
                        }}
                    >
                        <div className='condo-table-th-content'>
                            <div className='condo-table-th-title-content'>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                            {header.column.getIsSorted() === 'asc' && <SortAsc size='small' color={colors.green[5]} /> }
                            {header.column.getIsSorted() === 'desc' && <SortDesc size='small' color={colors.green[5]} />}
                            {header.column.getIsFiltered() && <Filter size='small' color={colors.green[5]} />}
                            {((header.column.columnDef.meta as TableColumnMeta)?.enableColumnOptions) && (
                                <Dropdown
                                    menu={{ 
                                        items: getColumnMenu(header),
                                    }}
                                >
                                    <div className='condo-table-th-more-icon'>
                                        <MoreVertical size='small' />
                                    </div>
                                </Dropdown>
                            )}
                        </div>
                        <div
                            className='condo-table-th-resize-handle'
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onDoubleClick={() => header.column.resetSize()}
                        />
                    </div>
                )
            })}
        </div>
    )
}
