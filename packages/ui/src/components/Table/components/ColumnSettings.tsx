import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import React, { useCallback } from 'react'

import { SortableColumnItem } from './SortableColumnItem'

import type { TableColumn } from '../types'

interface ColumnSettingsProps {
    columns: TableColumn[]
    table: {
        getColumn: (key: string) => { getIsVisible: () => boolean, toggleVisibility: (visible: boolean) => void } | undefined
        getVisibleLeafColumns: () => Array<{ getIsVisible: () => boolean }>
        setColumnOrder?: (columnOrder: string[]) => void
    }
}

export const ColumnSettings = ({ columns, table }: ColumnSettingsProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id && table.setColumnOrder) {
            const oldIndex = columns.findIndex(column => column.key === active.id)
            const newIndex = columns.findIndex(column => column.key === over?.id)
            
            const newOrder = arrayMove(columns, oldIndex, newIndex).map(col => col.key)
            table.setColumnOrder(newOrder)
        }
    }, [columns, table])

    const handleToggleVisibility = useCallback((columnKey: string, checked: boolean) => {
        table.getColumn(columnKey)?.toggleVisibility(checked)
    }, [table])

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={columns.map(c => c.key)} strategy={verticalListSortingStrategy}>
                <div className='condo-table-header-dropdown condo-table-column-settings-dropdown'>
                    {columns.map((column) => {
                        const isVisible = table.getColumn(column.key)?.getIsVisible()
                        const isLastVisibleColumn = isVisible && table.getVisibleLeafColumns().length === 1

                        return (
                            <SortableColumnItem
                                key={column.key}
                                column={column}
                                isVisible={isVisible || false}
                                isLastVisibleColumn={isLastVisibleColumn || false}
                                onToggleVisibility={(checked) => handleToggleVisibility(column.key, checked)}
                            />
                        )
                    })}
                </div>
            </SortableContext>
        </DndContext>
    )
}