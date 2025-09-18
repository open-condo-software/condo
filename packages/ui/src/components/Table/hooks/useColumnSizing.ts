import { ColumnSizingState, Table as ReactTable } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { TableSettings } from '../types.ts'

interface UseColumnSizingProps {
    settings: TableSettings
    setSettings: React.Dispatch<React.SetStateAction<TableSettings>>
    containerWidth?: number
}

export const useColumnSizing = ({ settings, setSettings, containerWidth }: UseColumnSizingProps) => {
    // Функция для сохранения размеров в процентах
    const saveColumnSizingAsPercentages = useCallback((table: ReactTable<any>, sizing: ColumnSizingState) => {
        const headers = table.getFlatHeaders()
        const visibleHeaders = headers.filter((header: any) => header.column.getIsVisible())
        const totalSize = visibleHeaders.reduce((sum: number, header: any) => {
            const columnId = header.column.id
            return sum + (sizing[columnId] || header.column.columnDef.size || 150)
        }, 0)
        
        const percentageSizing: { [key: string]: number } = {}
        Object.entries(sizing).forEach(([columnId, size]) => {
            if (size && totalSize > 0) {
                // Сохраняем процент с 2 знаками после запятой
                percentageSizing[columnId] = Math.round((size / totalSize) * 10000) / 100
            }
        })
        
        // Обновляем настройки с процентными значениями
        setSettings((prevSettings: TableSettings) => {
            const newSettings = { ...prevSettings }
            for (const [columnId, percentage] of Object.entries(percentageSizing)) {
                const existing = newSettings[columnId] || {}
                newSettings[columnId] = {
                    ...existing,
                    order: existing.order ?? Object.keys(newSettings).length,
                    visibility: existing.visibility ?? true,
                    size: percentage, // Сохраняем процент
                    isPercentage: true, // Флаг что это процент
                }
            }
            return newSettings
        })
    }, [setSettings])

    // Функция для конвертации процентов обратно в пиксели
    const convertPercentagesToPixels = useCallback((containerWidth: number): ColumnSizingState => {
        const columnSizing: ColumnSizingState = {}
        
        for (const key in settings) {
            const columnSettings = settings[key]
            if (columnSettings && typeof columnSettings.size === 'number') {
                if (columnSettings.isPercentage && containerWidth) {
                    // Конвертируем процент обратно в пиксели
                    columnSizing[key] = Math.round((columnSettings.size / 100) * containerWidth)
                } else {
                    columnSizing[key] = columnSettings.size
                }
            }
        }
        
        return columnSizing
    }, [settings])

    // Обновленная функция onColumnSizingChange
    const onColumnSizingChange = useCallback((updater: React.SetStateAction<ColumnSizingState>, table?: ReactTable<any>) => {
        setSettings((prevSettings: TableSettings) => {
            const prevColumnSizing: ColumnSizingState = {}
            for (const key in prevSettings) {
                const columnSettings = prevSettings[key]
                if (columnSettings && typeof columnSettings.size === 'number') {
                    if (columnSettings.isPercentage && containerWidth) {
                        prevColumnSizing[key] = Math.round((columnSettings.size / 100) * containerWidth)
                    } else {
                        prevColumnSizing[key] = columnSettings.size
                    }
                }
            }

            const newSize = typeof updater === 'function' ? updater(prevColumnSizing) : updater

            // Если передана таблица, сохраняем в процентах
            if (table) {
                setTimeout(() => {
                    saveColumnSizingAsPercentages(table, newSize)
                }, 0)
                return prevSettings // Возвращаем предыдущее состояние, обновление произойдет в saveColumnSizingAsPercentages
            }

            // Иначе сохраняем как обычно в пикселях
            const newSettings = { ...prevSettings }
            for (const key in newSize) {
                const existing = newSettings[key] || {}
                newSettings[key] = {
                    ...existing,
                    order: existing.order ?? Object.keys(newSettings).length,
                    visibility: existing.visibility ?? true,
                    size: newSize[key],
                    isPercentage: false,
                }
            }
            return newSettings
        })
    }, [containerWidth, saveColumnSizingAsPercentages, setSettings])

    // Вычисляем текущее состояние размеров колонок
    const columnSizing = useMemo(() => {
        return containerWidth ? convertPercentagesToPixels(containerWidth) : {}
    }, [containerWidth, convertPercentagesToPixels])

    return {
        columnSizing,
        onColumnSizingChange,
        saveColumnSizingAsPercentages,
    }
}
