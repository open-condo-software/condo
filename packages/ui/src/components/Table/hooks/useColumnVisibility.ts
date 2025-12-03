import { VisibilityState, RowData } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { TableSettings } from '../types'
import type { Dispatch, SetStateAction } from 'react'

interface UseColumnVisibilityProps<TData extends RowData = RowData> {
    settings: TableSettings<TData>
    setSettings: Dispatch<SetStateAction<TableSettings<TData>>>
}

export const useColumnVisibility = <TData extends RowData = RowData>({ settings, setSettings }: UseColumnVisibilityProps<TData>): {
    columnVisibility: VisibilityState
    onColumnVisibilityChange: (updater: SetStateAction<VisibilityState>) => void
} => {
    const columnVisibility = useMemo(() => {
        const visibility: VisibilityState = {}
        for (const key in settings) {
            const columnSettings = settings[key]
            if (columnSettings && typeof columnSettings.visibility === 'boolean') {
                visibility[key] = columnSettings.visibility
            }
        }
        return visibility
    }, [settings])

    const onColumnVisibilityChange = useCallback((updater: SetStateAction<VisibilityState>) => {
        setSettings((prevSettings: TableSettings<TData>) => {
            const prevVisibility: Record<string, boolean> = {}
            
            for (const key in prevSettings) {
                const columnSettings = prevSettings[key]
                if (columnSettings) {
                    prevVisibility[key] = columnSettings.visibility
                }
            }
    
            const newVisibility = typeof updater === 'function' ? updater(prevVisibility) : updater
    
            const newSettings = { ...prevSettings }
            for (const key in newVisibility) {
                if (newSettings[key]) {
                    newSettings[key] = {
                        ...newSettings[key],
                        visibility: newVisibility[key],
                    }
                }
            }
            return newSettings
        })
    }, [setSettings])

    return {
        columnVisibility,
        onColumnVisibilityChange,
    }
}
