import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RowData } from '@tanstack/react-table'
import React from 'react'

import { GripHorizontal } from '@open-condo/icons'
import { Space, Switch, Typography } from '@open-condo/ui/src'

import type { TableColumn } from '../types'

interface ColumnSettingsItemProps<TData extends RowData = RowData> {
    column: TableColumn<TData>
    table,
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

    return (
        <div
            ref={setNodeRef}
            className={`condo-table-column-settings-item ${isDragging ? 'is-dragging' : ''}`}
            style={style}
            {...attributes}
        >
            <Space size={12}>
                <div
                    className='condo-table-switch-container'
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    role='button'
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!isLastVisibleColumn) {
                                onToggleVisibility(!isVisible)
                            }
                        }
                    }}
                    aria-label={`${isVisible ? 'Hide' : 'Show'} column ${column.header}`}
                    aria-disabled={isLastVisibleColumn}
                >
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
                    role='button'
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                        }
                    }}
                    aria-label={`Drag column ${column.header}`}
                >
                    <GripHorizontal size='small'/>
                </div>
                <Typography.Text type='primary' size='medium'>
                    {typeof column.header === 'string' ? column.header : typeof column.header === 'function' ? column.header({ table }) : ''}
                </Typography.Text>
            </Space>
        </div>
    )
}
