import { ColumnOrderState, RowData } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { TableSettings } from '../types.ts'

interface UseColumnOrderProps<TData extends RowData = RowData> {
    settings: TableSettings<TData>
    setSettings: React.Dispatch<React.SetStateAction<TableSettings<TData>>>
}

export const useColumnOrder = <TData extends RowData = RowData>({ settings, setSettings }: UseColumnOrderProps<TData>): {
    columnOrder: ColumnOrderState
    onColumnOrderChange: (updater: React.SetStateAction<ColumnOrderState>) => void
} => {
    const columnOrder = useMemo(() => {
        return Object.entries(settings)
            .sort(([, a], [, b]) => (a as TableSettings<TData>[keyof TData]).order - (b as TableSettings<TData>[keyof TData]).order)
            .map(([key]) => key)
    }, [settings])

    const onColumnOrderChange = useCallback((updater: React.SetStateAction<ColumnOrderState>) => {
        setSettings((prevSettings: TableSettings<TData>) => {
            // Собираем текущий порядок из настроек
            const prevOrder = Object.entries(prevSettings)
                .sort(([, a], [, b]) => (a as TableSettings<TData>[keyof TData]).order - (b as TableSettings<TData>[keyof TData]).order)
                .map(([key]) => key)

            const newOrder = typeof updater === 'function' ? updater(prevOrder) : updater

            // Обновляем порядок в настройках
            const newSettings = { ...prevSettings }
            newOrder.forEach((key, index) => {
                if (newSettings[key as keyof TData]) {
                    newSettings[key as keyof TData] = {
                        ...newSettings[key as keyof TData],
                        order: index,
                    }
                }
            })
            return newSettings
        })
    }, [setSettings])

    return {
        columnOrder,
        onColumnOrderChange,
    }
}
