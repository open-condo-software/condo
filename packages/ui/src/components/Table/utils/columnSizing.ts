import { RowData } from '@tanstack/react-table'

import type { TableColumn } from '../types'

export const MIN_COLUMN_WIDTH = 60
export const DEFAULT_COLUMN_PERCENTAGE = 15

export interface ColumnSizingConfig<TData extends RowData = RowData> {
    columns: TableColumn<TData>[]
    containerWidth: number
}

export const calculateInitialColumnSizes = <TData extends RowData = RowData>({ columns, containerWidth }: ColumnSizingConfig<TData>): Record<string, number> => {
    const visibleColumns: TableColumn<TData>[] = []
    const hiddenColumns: TableColumn<TData>[] = []
    for (const col of columns) {
        if (col.initialVisibility !== false) {
            visibleColumns.push(col)
        } else {
            hiddenColumns.push(col)
        }
    }

    // Разделяем колонки на те, у которых есть initialSize (проценты) и те, у которых нет
    const columnsWithInitialSize: TableColumn<TData>[] = []
    const columnsWithoutInitialSize: TableColumn<TData>[] = []
    for (const col of visibleColumns) {
        if (col.initialSize) {
            columnsWithInitialSize.push(col)
        } else {
            columnsWithoutInitialSize.push(col)
        }
    }

    // Конвертируем проценты в пиксели и проверяем минимальный размер
    const pixelSizes: Record<keyof TData, number> = {} as Record<keyof TData, number>
    let totalPercentageUsed = 0

    for (const col of columnsWithInitialSize) {
        const pixelSize = (col.initialSize! / 100) * containerWidth
        console.log('pixelSize1', pixelSize)
        const finalSize = Math.max(pixelSize, MIN_COLUMN_WIDTH)
        pixelSizes[col.dataKey] = finalSize 
        totalPercentageUsed += col.initialSize!
    }

    // Нормализуем проценты, если сумма ≠ 100%
    if (totalPercentageUsed > 0 && totalPercentageUsed > 100 && columnsWithoutInitialSize.length === 0) {
        const normalizationFactor = 100 / totalPercentageUsed
        for (const key in pixelSizes) {
            const originalPercentage = columnsWithInitialSize.find(col => col.dataKey === key)?.initialSize
            if (!originalPercentage) continue
            const normalizedPercentage = originalPercentage * normalizationFactor
            const normalizedSize = (normalizedPercentage / 100) * containerWidth
            pixelSizes[key] = Math.max(normalizedSize, MIN_COLUMN_WIDTH)
        }
    }

    // Распределяем оставшееся пространство между колонками без initialSize
    let usedSpace = 0
    for (const key in pixelSizes) {
        usedSpace += pixelSizes[key]
    }
    
    const remainingSpace = Math.max(containerWidth - usedSpace, 0)
    const spacePerFlexibleColumn = columnsWithoutInitialSize.length > 0 
        ? Math.max(Math.floor(remainingSpace / columnsWithoutInitialSize.length), MIN_COLUMN_WIDTH)
        : 0

    const sizesByKey: Record<keyof TData, number> = {} as Record<keyof TData, number>

    // Применяем размеры
    for (const col of columnsWithInitialSize) {
        sizesByKey[col.dataKey] = pixelSizes[col.dataKey]
    }

    for (const col of columnsWithoutInitialSize) {
        sizesByKey[col.dataKey] = spacePerFlexibleColumn
    }

    // ВАЖНО: Убеждаемся, что все колонки занимают 100% ширины таблицы
    let totalUsedSpace = 0
    for (const key in sizesByKey) {
        totalUsedSpace += sizesByKey[key]
    }
    if (totalUsedSpace < containerWidth) {
        // Если есть неиспользованное пространство, распределяем его равномерно между всеми колонками
        const extraSpace = containerWidth - totalUsedSpace
        const extraPerColumn = Math.floor(extraSpace / visibleColumns.length)
            
        for (const col of visibleColumns) {
            sizesByKey[col.dataKey] = (sizesByKey[col.dataKey]) + extraPerColumn
        }
    }

    // Обрабатываем скрытые колонки - они получают размер на основе initialSize
    for (const col of hiddenColumns) {
        if (typeof col.initialSize === 'number') {
            // Если есть initialSize, используем его (в процентах)
            const percentageSize = (col.initialSize / 100) * containerWidth
            sizesByKey[col.dataKey] = Math.max(percentageSize, MIN_COLUMN_WIDTH)
        } else {
            // Если нет initialSize, используем дефолтный размер (15% от контейнера)
            const defaultSize = (DEFAULT_COLUMN_PERCENTAGE / 100) * containerWidth
            sizesByKey[col.dataKey] = Math.max(defaultSize, MIN_COLUMN_WIDTH)
        }
    }

    return sizesByKey
}
