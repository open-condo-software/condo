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
import { RowData, Table } from '@tanstack/react-table'
import React, { useCallback, useRef } from 'react'

import { ColumnSettingsItem } from '@open-condo/ui/src/components/Table/components/ColumnSettingsItem'
import type { ColumnDefWithId } from '@open-condo/ui/src/components/Table/types'

interface ColumnSettingsProps<TData extends RowData = RowData> {
    columns: ColumnDefWithId<TData>[]
    table: Table<TData>
}

export const ColumnSettings = <TData extends RowData = RowData>({ columns, table }: ColumnSettingsProps<TData>) => {
    const columnWithoutToggleVisibility = useRef<number>(
        table.getVisibleLeafColumns().reduce((acc, column) => acc + (column.columnDef.meta?.enableColumnSettings ? 0 : 1), 0)
    )

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id && table.setColumnOrder) {
            const oldIndex = columns.findIndex(column => column.id === active.id)
            const newIndex = columns.findIndex(column => column.id === over?.id)
            
            const newOrder = arrayMove(columns, oldIndex, newIndex).map(col => col.id)
            table.setColumnOrder(newOrder)
        }
    }, [columns, table])

    const handleToggleVisibility = useCallback((columnId: string, checked: boolean) => {
        const column = table.getColumn(columnId)
        
        // NOTE: If column is hidden - reset filter and sorting state
        if (!checked && column) {
            column.clearSorting()
            column.setFilterValue(undefined)
        }
        
        column?.toggleVisibility(checked)
    }, [table])

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={columns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className='condo-table-column-settings-dropdown'>
                    {columns.map((column) => {
                        if (!table.getColumn(column.id)?.columnDef?.meta?.enableColumnSettings) return 
                        const isVisible = table.getColumn(column.id)?.getIsVisible()
                        const isLastVisibleColumn = isVisible && table.getVisibleLeafColumns().length === columnWithoutToggleVisibility.current + 1

                        return (
                            <ColumnSettingsItem
                                key={column.id}
                                column={column}
                                table={table}
                                isVisible={isVisible || false}
                                isLastVisibleColumn={isLastVisibleColumn || false}
                                onToggleVisibility={(checked: boolean) => handleToggleVisibility(column.id, checked)}
                            />
                        )
                    })}
                </div>
            </SortableContext>
        </DndContext>
    )
}