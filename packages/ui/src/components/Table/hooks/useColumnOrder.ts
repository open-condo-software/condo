import { ColumnOrderState } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { TableSettings } from '../types.ts'

interface UseColumnOrderProps {
    settings: TableSettings
    setSettings: React.Dispatch<React.SetStateAction<TableSettings>>
}

export const useColumnOrder = ({ settings, setSettings }: UseColumnOrderProps) => {
    const columnOrder = useMemo(() => {
        return Object.entries(settings)
            .sort(([, a], [, b]) => (a as TableSettings[string]).order - (b as TableSettings[string]).order)
            .map(([key]) => key)
    }, [settings])

    const onColumnOrderChange = useCallback((updater: React.SetStateAction<ColumnOrderState>) => {
        const newOrder = typeof updater === 'function' ? updater(columnOrder) : updater
        setSettings((prev: TableSettings) => {
            const newSettings: TableSettings = { ...prev }
            newOrder.forEach((key, index) => {
                if (newSettings[key]) {
                    newSettings[key].order = index
                }
            })
            return newSettings
        })
    }, [columnOrder, setSettings])

    return {
        columnOrder,
        onColumnOrderChange,
    }
}
