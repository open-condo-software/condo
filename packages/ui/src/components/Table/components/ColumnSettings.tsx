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
import { RowData, Table, ColumnOrderState } from '@tanstack/react-table'
import React, { useCallback } from 'react'

import { ReorderableColumnItem } from './ReorderableColumnItem'

import type { TableColumn } from '../types'

interface ColumnSettingsProps<TData extends RowData = RowData> {
    columns: TableColumn<TData>[]
    table: Table<TData>
}

export const ColumnSettings = <TData extends RowData = RowData>({ columns, table }: ColumnSettingsProps<TData>) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id && table.setColumnOrder) {
            const oldIndex = columns.findIndex(column => column.dataKey === active.id)
            const newIndex = columns.findIndex(column => column.dataKey === over?.id)
            
            const newOrder = arrayMove(columns, oldIndex, newIndex).map(col => col.dataKey)
            table.setColumnOrder(newOrder as ColumnOrderState)
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
            <SortableContext items={columns.map(c => c.dataKey as string)} strategy={verticalListSortingStrategy}>
                <div className='condo-table-header-dropdown condo-table-column-settings-dropdown'>
                    {columns.map((column) => {
                        const isVisible = table.getColumn(column.dataKey as string)?.getIsVisible()
                        const isLastVisibleColumn = isVisible && table.getVisibleLeafColumns().length === 1

                        return (
                            <ReorderableColumnItem
                                key={column.dataKey as string}
                                column={column as TableColumn<TData>}
                                isVisible={isVisible || false}
                                isLastVisibleColumn={isLastVisibleColumn || false}
                                onToggleVisibility={(checked: boolean) => handleToggleVisibility(column.dataKey as string, checked)}
                            />
                        )
                    })}
                </div>
            </SortableContext>
        </DndContext>
    )
}