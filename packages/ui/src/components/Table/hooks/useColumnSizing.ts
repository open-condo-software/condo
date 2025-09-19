import { ColumnSizingState, RowData } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { TableSettings } from '../types.ts'

interface UseColumnSizingProps<TData extends RowData = RowData> {
    settings: TableSettings<TData>
    setSettings: React.Dispatch<React.SetStateAction<TableSettings<TData>>>
}

export const useColumnSizing = <TData extends RowData = RowData>({ settings, setSettings }: UseColumnSizingProps<TData>): {
    columnSizing: ColumnSizingState
    onColumnSizingChange: (updater: React.SetStateAction<ColumnSizingState>) => void
} => {
    // Обновленная функция onColumnSizingChange
    const onColumnSizingChange = useCallback((updater: React.SetStateAction<ColumnSizingState>) => {
        setSettings((prevSettings: TableSettings<TData>) => {
            const prevColumnSizing: ColumnSizingState = {}
            for (const key in prevSettings) {
                const columnSettings = prevSettings[key as keyof TData]
                if (columnSettings && typeof columnSettings.size === 'number') {
                    prevColumnSizing[key] = columnSettings.size
                }
            }

            const newSize = typeof updater === 'function' ? updater(prevColumnSizing) : updater

            // Сохраняем в пикселях
            const newSettings = { ...prevSettings }
            
            // Если передан пустой объект, очищаем все размеры
            if (Object.keys(newSize).length === 0) {
                for (const key in newSettings) {
                    if (newSettings[key as keyof TData]) {
                        newSettings[key as keyof TData] = {
                            ...newSettings[key as keyof TData],
                            size: 0, // Очищаем размер
                        }
                    }
                }
            } else {
                // Обновляем только переданные размеры
                for (const key in newSize) {
                    if (newSize[key] && newSettings[key as keyof TData]) {
                        const existing = newSettings[key as keyof TData]
                        newSettings[key as keyof TData] = {
                            ...existing,
                            size: newSize[key],
                        }
                    }
                }
            }
            return newSettings
        })
    }, [setSettings])

    // Вычисляем текущее состояние размеров колонок
    const columnSizing = useMemo(() => {
        const columnSizing: ColumnSizingState = {}
        for (const key in settings) {
            const columnSettings = settings[key as keyof TData]
            if (columnSettings && typeof columnSettings.size === 'number') {
                columnSizing[key] = columnSettings.size
            }
        }
        return columnSizing
    }, [settings])

    return {
        columnSizing,
        onColumnSizingChange,
    }
}
