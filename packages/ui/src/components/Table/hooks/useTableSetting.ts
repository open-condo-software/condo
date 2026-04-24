import { RowData, ColumnDef } from '@tanstack/react-table'
import debounce from 'lodash/debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DEFAULT_MIN_SIZE, DEBOUNCE_SETTINGS_SAVE } from '@open-condo/ui/src/components/Table/constants'
import { useColumnOrder } from '@open-condo/ui/src/components/Table/hooks/useColumnOrder'
import { useColumnSizing } from '@open-condo/ui/src/components/Table/hooks/useColumnSizing'
import { useColumnVisibility } from '@open-condo/ui/src/components/Table/hooks/useColumnVisibility'
import { ColumnDefWithId, TableSettings } from '@open-condo/ui/src/components/Table/types'
import { getStorage, saveStorage } from '@open-condo/ui/src/components/Table/utils/storage'

interface UsePersistentTableStateProps<TData extends RowData = RowData> {
    storageKey: string
    columns: ColumnDefWithId<TData>[]
}

export function getInitialTableState<TData extends RowData> (
    storageKey: string,
    columns: ColumnDefWithId<TData>[],
    resetSettings: boolean = false,
): TableSettings<TData> {
    if (!resetSettings) {
        const savedState = getStorage(storageKey)
        if (savedState) {
            return savedState as TableSettings<TData>
        }
    }

    const orderedColumns: (ColumnDef<TData> | null)[] = new Array(columns.length).fill(null)
    const unorderedColumns: ColumnDef<TData>[] = []

    for (const col of columns) {
        const initialOrder = (col.meta)?.initialOrder 
        if (initialOrder !== undefined && initialOrder < columns.length && !orderedColumns[initialOrder]) {
            orderedColumns[initialOrder] = col
        } else {
            unorderedColumns.push(col)
        }
    }

    const resultColumns = orderedColumns
        .map(c => (c || unorderedColumns.shift()))
        .filter((column): column is ColumnDefWithId<TData> => 
            column !== undefined && column.id !== undefined
        )

    return resultColumns.reduce((result, column, index) => {
        let columnSize: number | string = ''
        const sizeValue = column.meta?.initialSize
        const minSize = column.minSize ?? DEFAULT_MIN_SIZE
        
        if (sizeValue !== undefined) {
            if (typeof sizeValue === 'string' && sizeValue.includes('%')) {
                columnSize = sizeValue
            } else if (typeof sizeValue === 'number') {
                columnSize = sizeValue
            } else if (typeof sizeValue === 'string') {
                const parsed = Number.parseInt(sizeValue, 10)
                if (!Number.isNaN(parsed)) {
                    columnSize = parsed
                }
            }
        }
        
        const initialVisibility = column.meta?.initialVisibility ?? true
        
        result[column.id] = {
            order: index,
            visibility: initialVisibility,
            size: columnSize,
            minSize: minSize,
        }
        return result
    }, {} as TableSettings<TData>)
}

export const useTableSetting = <TData extends RowData = RowData>({ storageKey, columns }: UsePersistentTableStateProps<TData>) => {
    const [settings, setSettings] = useState<TableSettings<TData>>(() => 
        getInitialTableState(storageKey, columns)
    )

    const debouncedSave = useMemo(
        () => debounce((state: TableSettings<TData>) => saveStorage(storageKey, state), DEBOUNCE_SETTINGS_SAVE),
        [storageKey]
    )

    useEffect(() => {
        debouncedSave(settings)
    }, [settings, debouncedSave])

    const { columnVisibility, onColumnVisibilityChange } = useColumnVisibility<TData>({
        settings,
        setSettings,
    })

    const { columnOrder, onColumnOrderChange } = useColumnOrder<TData>({
        settings,
        setSettings,
    })

    const { columnSizing, onColumnSizingChange } = useColumnSizing<TData>({
        settings,
        setSettings,
    })

    const resetSettings = useCallback(() => {
        setSettings(getInitialTableState(storageKey, columns, true))
    }, [storageKey, columns, setSettings])

    return {
        columnVisibility,
        columnOrder,
        columnSizing,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
        resetSettings,
    }
}