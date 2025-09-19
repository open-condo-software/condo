import { RowData } from '@tanstack/react-table'
import debounce from 'lodash/debounce'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useColumnOrder } from '@open-condo/ui/src/components/Table/hooks/useColumnOrder'
import { useColumnSizing } from '@open-condo/ui/src/components/Table/hooks/useColumnSizing'
import { useColumnVisibility } from '@open-condo/ui/src/components/Table/hooks/useColumnVisibility'
import { TableSettings, TableColumn } from '@open-condo/ui/src/components/Table/types'
import { calculateInitialColumnSizes } from '@open-condo/ui/src/components/Table/utils/columnSizing'
import { getStorage, saveStorage } from '@open-condo/ui/src/components/Table/utils/storage'


interface UsePersistentTableStateProps<TData extends RowData = RowData> {
    storageKey: string
    columns: Array<TableColumn<TData>>
    containerWidth: number | null
}

export const useTableState = <TData extends RowData = RowData>({ storageKey, columns, containerWidth }: UsePersistentTableStateProps<TData>) => {
    const getInitialState = useCallback((): TableSettings<TData> => {
        
        const savedState = getStorage(storageKey)

        if (savedState) {
            console.log('savedState', savedState)
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

        const finalColumns = orderedColumns.map((c) => (c || unorderedColumns.shift())!)

        const result: TableSettings<TData> = {} as TableSettings<TData>
        finalColumns.forEach((column, index) => {
            if (column) {
                result[column.dataKey] = {
                    order: index,
                    visibility: column.initialVisibility ?? true,
                    size: 0,
                }
            }
        })
        console.log('result', result)
        return result
    }, [columns, storageKey])

    const [settings, setSettings] = useState<TableSettings<TData>>(getInitialState)

    useEffect(() => {
        if (containerWidth && Object.values(settings).filter((s): s is TableSettings<TData>[keyof TData] => s !== undefined).some((s => s.size === 0))) {            
            const newSizes = calculateInitialColumnSizes({
                columns: columns.filter((c): c is TableColumn<TData> => Boolean(c)),
                containerWidth: containerWidth!,
            })

            setSettings(prevSettings => {
                const newSettings = { ...prevSettings }
                for (const [key, size] of Object.entries(newSizes)) {
                    if (size && newSettings[key as keyof TData]) {
                        newSettings[key as keyof TData] = {
                            ...newSettings[key as keyof TData],
                            size,
                        }
                    }
                }
                return newSettings
            })
        }
    }, [containerWidth, columns, settings])

    const debouncedSave = useMemo(
        () => debounce((state: TableSettings<TData>) => saveStorage(storageKey, state), 300),
        [storageKey]
    )

    useEffect(() => {
        debouncedSave(settings)
    }, [settings, debouncedSave])

    const { columnSizing, onColumnSizingChange } = useColumnSizing<TData>({
        settings,
        setSettings,
    })

    const { columnVisibility, onColumnVisibilityChange } = useColumnVisibility<TData>({
        settings,
        setSettings,
    })

    const { columnOrder, onColumnOrderChange } = useColumnOrder<TData>({
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