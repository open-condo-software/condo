import { VisibilityState } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { TableSettings } from '../types.ts'

interface UseColumnVisibilityProps {
    settings: TableSettings
    setSettings: React.Dispatch<React.SetStateAction<TableSettings>>
}

export const useColumnVisibility = ({ settings, setSettings }: UseColumnVisibilityProps) => {
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

    const onColumnVisibilityChange = useCallback((updater: React.SetStateAction<VisibilityState>) => {
        const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater
        setSettings((prev: TableSettings) => {
            const newSettings: TableSettings = { ...prev }
            for (const key in newVisibility) {
                if (newSettings[key]) {
                    newSettings[key].visibility = newVisibility[key]
                }
            }
            return newSettings
        })
    }, [columnVisibility, setSettings])

    return {
        columnVisibility,
        onColumnVisibilityChange,
    }
}
