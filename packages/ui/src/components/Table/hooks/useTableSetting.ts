import { RowData } from '@tanstack/react-table'
import debounce from 'lodash/debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useColumnOrder } from '@open-condo/ui/src/components/Table/hooks/useColumnOrder'
import { useColumnSizing } from '@open-condo/ui/src/components/Table/hooks/useColumnSizing'
import { useColumnVisibility } from '@open-condo/ui/src/components/Table/hooks/useColumnVisibility'
import { TableSettings, TableColumn, DefaultColumn } from '@open-condo/ui/src/components/Table/types'
import { getStorage, saveStorage } from '@open-condo/ui/src/components/Table/utils/storage'


interface UsePersistentTableStateProps<TData extends RowData = RowData> {
    storageKey: string
    columns: TableColumn<TData>[]
    defaultColumn?: DefaultColumn
}

export const useTableSetting = <TData extends RowData = RowData>({ storageKey, columns, defaultColumn }: UsePersistentTableStateProps<TData>) => {
    const getInitialState = useCallback((): TableSettings<TData> => {
        const savedState = getStorage(storageKey)

        if (savedState) {
            return savedState as TableSettings<TData>
        }

        const orderedColumns: (TableColumn<TData> | null)[] = new Array(columns.length).fill(null)
        const unorderedColumns: TableColumn<TData>[] = []

        for (const col of columns) {
            if (col.initialOrder !== undefined && col.initialOrder < columns.length && !orderedColumns[col.initialOrder]) {
                orderedColumns[col.initialOrder] = col
            } else {
                unorderedColumns.push(col)
            }
        }

        const resultColumns = orderedColumns.map(c => (c || unorderedColumns.shift())).filter(Boolean) as (TableColumn<TData>)[]

        return resultColumns.reduce((result, column, index) => {
            let columnSize: number | string = 0
            const sizeValue = column.initialSize ?? (defaultColumn?.initialSize ?? undefined)
            
            if (sizeValue !== undefined) {
                if (typeof sizeValue === 'string' && sizeValue.includes('%')) {
                    columnSize = sizeValue
                } else if (typeof sizeValue === 'number') {
                    columnSize = sizeValue
                } else if (typeof sizeValue === 'string') {
                    const parsed = parseInt(sizeValue, 10)
                    if (!isNaN(parsed)) {
                        columnSize = parsed
                    }
                }
            }
            
            result[column.id] = {
                order: index,
                visibility: column.initialVisibility !== undefined ? column.initialVisibility : (defaultColumn?.initialVisibility ?? true),
                size: columnSize,
            }
            return result
        }, {} as TableSettings<TData>)
    }, [columns, storageKey, defaultColumn])

    const [settings, setSettings] = useState<TableSettings<TData>>(getInitialState)

    const debouncedSave = useMemo(
        () => debounce((state: TableSettings<TData>) => saveStorage(storageKey, state), 300),
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

    return {
        columnVisibility,
        columnOrder,
        columnSizing,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
    }
}