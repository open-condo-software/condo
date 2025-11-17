import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RowData } from '@tanstack/react-table'
import React from 'react'

import { GripHorizontal } from '@open-condo/icons'
import { Space, Switch, Typography } from '@open-condo/ui/src'

import type { TableColumn } from '../types'

interface ReorderableColumnItemProps<TData extends RowData = RowData> {
    column: TableColumn<TData>
    isVisible: boolean
    isLastVisibleColumn: boolean
    onToggleVisibility: (checked: boolean) => void
}

export const ReorderableColumnItem = <TData extends RowData = RowData> ({
    column,
    isVisible,
    isLastVisibleColumn,
    onToggleVisibility,
}: ReorderableColumnItemProps<TData>) => {
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: column.dataKey as string,
        disabled: false,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const handleDragStart = (e: React.DragEvent) => {
        const img = new Image()
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
        e.dataTransfer.setDragImage(img, 0, 0)
    }

    return (
        <div
            ref={setNodeRef}
            className={`condo-table-sortable-column-item ${isDragging ? 'is-dragging' : ''}`}
            style={style}
            {...attributes}
            onDragStart={handleDragStart}
        >
            <Space size={12}>
                <div
                    className='condo-table-switch-container'
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
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
                >
                    <GripHorizontal size='small'/>
                </div>
                <Typography.Text type='primary' size='medium'>
                    {column.header as string}
                </Typography.Text>
            </Space>
        </div>
    )
}
