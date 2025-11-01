import { VisibilityState, RowData } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { TableSettings } from '../types.ts'

interface UseColumnVisibilityProps<TData extends RowData = RowData> {
    settings: TableSettings<TData>
    setSettings: React.Dispatch<React.SetStateAction<TableSettings<TData>>>
}

export const useColumnVisibility = <TData extends RowData = RowData>({ settings, setSettings }: UseColumnVisibilityProps<TData>): {
    columnVisibility: VisibilityState
    onColumnVisibilityChange: (updater: React.SetStateAction<VisibilityState>) => void
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

    const onColumnVisibilityChange = useCallback((updater: React.SetStateAction<Record<string, boolean>>) => {
        setSettings((prevSettings: TableSettings<TData>) => {
            const prevVisibility: Record<string, boolean> = {}
            
            // Собираем текущую видимость
            for (const key in prevSettings) {
                const columnSettings = prevSettings[key as keyof TData]
                if (columnSettings) {
                    prevVisibility[key] = columnSettings.visibility
                }
            }
    
            const newVisibility = typeof updater === 'function' ? updater(prevVisibility) : updater
    
            // Обновляем настройки
            const newSettings = { ...prevSettings }
            for (const key in newVisibility) {
                if (newSettings[key as keyof TData]) {
                    newSettings[key as keyof TData] = {
                        ...newSettings[key as keyof TData],
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
