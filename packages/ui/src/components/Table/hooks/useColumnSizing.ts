import { ColumnSizingState, RowData } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { TableSettings } from '../types'

interface UseColumnSizingProps<TData extends RowData = RowData> {
    settings: TableSettings<TData>
    setSettings: React.Dispatch<React.SetStateAction<TableSettings<TData>>>
}

export const useColumnSizing = <TData extends RowData = RowData>({ 
    settings, 
    setSettings, 
}: UseColumnSizingProps<TData>): {
    columnSizing: ColumnSizingState
    onColumnSizingChange: (updater: React.SetStateAction<ColumnSizingState>) => void
} => {
    
    const columnSizing = useMemo(() => {
        const sizes: ColumnSizingState = {}
        Object.entries(settings).forEach(([columnId, columnSettings]) => {
            if (columnSettings.size) {
                sizes[columnId] = columnSettings.size
            }
        })
        return sizes
    }, [settings])

    const onColumnSizingChange = useCallback((updater: React.SetStateAction<ColumnSizingState>) => {
        setSettings((prevSettings: TableSettings<TData>) => {
            const newSizing = typeof updater === 'function' ? updater(columnSizing) : updater
            
            const newSettings = { ...prevSettings }
            Object.entries(newSizing).forEach(([columnId, size]) => {
                if (newSettings[columnId]) {
                    newSettings[columnId] = {
                        ...newSettings[columnId],
                        size: size,
                    }
                }
            })
            return newSettings
        })
    }, [columnSizing, setSettings])

    return {
        columnSizing,
        onColumnSizingChange,
    }
}
