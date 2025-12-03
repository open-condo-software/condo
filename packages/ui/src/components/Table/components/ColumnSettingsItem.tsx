import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { flexRender, RowData, Table } from '@tanstack/react-table'
import classNames from 'classnames'
import React, { useMemo } from 'react'

import { GripHorizontal } from '@open-condo/icons'
import { Space, Switch, Typography } from '@open-condo/ui/src'
import type { ColumnDefWithId } from '@open-condo/ui/src/components/Table/types'


interface ColumnSettingsItemProps<TData extends RowData = RowData> {
    column: ColumnDefWithId<TData>
    table: Table<TData>
    isVisible: boolean
    isLastVisibleColumn: boolean
    onToggleVisibility: (checked: boolean) => void
}

export const ColumnSettingsItem = <TData extends RowData = RowData> ({
    column,
    table,
    isVisible,
    isLastVisibleColumn,
    onToggleVisibility,
}: ColumnSettingsItemProps<TData>) => {
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: column.id,
        disabled: false,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const text = useMemo(() => 
        flexRender(column.header, { 
            column: table.getColumn(column.id)!, 
            table: table, 
            header: table
                .getFlatHeaders()
                .find(header => header.id === column.id)!,
        })
    ,  [column.header, column.id, table])

    return (
        <div
            ref={setNodeRef}
            className={classNames(
                'condo-table-column-settings-item',
                isDragging && 'is-dragging',
            )}
            style={style}
            {...attributes}
        >
            <Space size={12}>
                <div className='condo-table-switch-container'>
                    <Switch
                        checked={isVisible}
                        disabled={isLastVisibleColumn}
                        onChange={(checked) => onToggleVisibility(checked)}
                        size='small'
                    />
                </div>
                <div 
                    className='condo-table-grip-container'
                    {...listeners}
                >
                    <GripHorizontal size='small'/>
                </div>
                <Typography.Text type='primary' size='medium'>
                    {text}
                </Typography.Text>
            </Space>
        </div>
    )
}
