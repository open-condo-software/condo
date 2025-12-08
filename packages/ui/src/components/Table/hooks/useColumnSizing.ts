import { ColumnSizingState, RowData } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { TableSettings } from '../types'
import type { Dispatch, SetStateAction } from 'react'

interface UseColumnSizingProps<TData extends RowData = RowData> {
    settings: TableSettings<TData>
    setSettings: Dispatch<SetStateAction<TableSettings<TData>>>
}

type ColumnSizingResult = {
    columnSizing: ColumnSizingState
    onColumnSizingChange: (updater: SetStateAction<ColumnSizingState>) => void
}


const convertPercentToPixels = (size: string, tableWidth: number): number => {
    if (size.includes('%')) {
        const percent = Number.parseFloat(size)
        if (!Number.isNaN(percent)) {
            return (tableWidth * percent) / 100
        }
    }
    return 0
}

const distributeRemainingSpace = (
    columnSizing: ColumnSizingState,
    tableWidth: number,
    allColumnIds: string[],
    lastColumnId: string
): ColumnSizingState => {
    const zeroSizedColumns: string[] = []
    let totalUsedWidth = 0

    allColumnIds.forEach((columnId) => {
        const size = columnSizing[columnId] || 0
        if (size === 0) {
            zeroSizedColumns.push(columnId)
        } else {
            totalUsedWidth += size
        }
    })

    if (zeroSizedColumns.length > 0 && tableWidth > 0) {
        const remainingSpace = Math.max(0, tableWidth - totalUsedWidth)
        const spacePerColumn = remainingSpace / zeroSizedColumns.length

        zeroSizedColumns.forEach((columnId) => {
            columnSizing[columnId] = spacePerColumn
        })
    } else if (zeroSizedColumns.length === 0 && tableWidth > 0) {
        const freeSpace = Math.max(0, tableWidth - totalUsedWidth)
        columnSizing[lastColumnId] = (columnSizing[lastColumnId] ?? 0) + freeSpace
    }

    return columnSizing
}

export const useColumnSizing = <TData extends RowData = RowData>({ 
    settings, 
    setSettings, 
}: UseColumnSizingProps<TData>): ColumnSizingResult => {
    const [tableWidth, setTableWidth] = useState<number>(0)

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            setTableWidth(entries[0].contentRect.width)
        })
        const target = document.querySelector('.condo-table-wrapper')
        if (target) {
            observer.observe(target)
        }
        return () => observer.disconnect()
    }, [])

    const columnSizing = useMemo(() => {
        const sizes: ColumnSizingState = {}
        
        const allColumnIds = Object.keys(settings)

        const visibleColumnIds = allColumnIds.filter(
            columnId => settings[columnId]?.visibility !== false
        )
        const hiddenColumnIds = allColumnIds.filter(
            columnId => settings[columnId]?.visibility === false
        )

        let lastColumnId = visibleColumnIds[0]

        visibleColumnIds.forEach((columnId) => {
            const columnSettings = settings[columnId]

            if (typeof columnSettings.size === 'string') {
                const sizeInPixels = convertPercentToPixels(columnSettings.size, tableWidth)
                sizes[columnId] = sizeInPixels
            } else if (typeof columnSettings.size === 'number') {
                sizes[columnId] = Math.max(columnSettings.size, columnSettings.minSize)
            } else {
                sizes[columnId] = 0
            }

            if (settings[columnId].order > settings[lastColumnId].order) {
                lastColumnId = columnId
            }
        })


        const result = distributeRemainingSpace(sizes, tableWidth, visibleColumnIds, lastColumnId)
        
        hiddenColumnIds.forEach((columnId) => {
            const columnSettings = settings[columnId]
            
            if (columnSettings.size === 0) {
                if (tableWidth > 0) {
                    const sizeInPixels = (tableWidth * 10) / 100
                    result[columnId] = Math.max(sizeInPixels, columnSettings.minSize)
                } else {
                    result[columnId] = 0
                }
            } else {
                if (typeof columnSettings.size === 'string') {
                    const sizeInPixels = convertPercentToPixels(columnSettings.size, tableWidth)
                    result[columnId] = Math.max(sizeInPixels, columnSettings.minSize)
                } else if (typeof columnSettings.size === 'number') {
                    result[columnId] = Math.max(columnSettings.size, columnSettings.minSize)
                }
            }
        })
        
        return result
    }, [settings, tableWidth])

    const onColumnSizingChange = useCallback((updater: SetStateAction<ColumnSizingState>) => {
        setSettings((prevSettings: TableSettings<TData>) => {
            const currentSizing: ColumnSizingState = {}
            const allColumnIds = Object.keys(prevSettings)
            
            const visibleColumnIds = allColumnIds.filter(
                columnId => prevSettings[columnId]?.visibility !== false
            )
            const hiddenColumnIds = allColumnIds.filter(
                columnId => prevSettings[columnId]?.visibility === false
            )
            
            let lastColumnId = visibleColumnIds[0]
            
            visibleColumnIds.forEach((columnId) => {
                const columnSettings = prevSettings[columnId]
                if (typeof columnSettings.size === 'string') {
                    const sizeInPixels = convertPercentToPixels(columnSettings.size, tableWidth)
                    currentSizing[columnId] = sizeInPixels
                } else if (typeof columnSettings.size === 'number') {
                    currentSizing[columnId] = Math.max(columnSettings.size, columnSettings.minSize)
                } else {
                    currentSizing[columnId] = 0
                }

                if (prevSettings[columnId].order > prevSettings[lastColumnId].order) {
                    lastColumnId = columnId
                }
            })
            
            const distributedSizing = distributeRemainingSpace(currentSizing, tableWidth, visibleColumnIds, lastColumnId)
            
            hiddenColumnIds.forEach((columnId) => {
                const columnSettings = prevSettings[columnId]
                
                if (columnSettings?.size === 0) {
                    if (tableWidth > 0) {
                        const sizeInPixels = (tableWidth * 10) / 100
                        distributedSizing[columnId] = Math.max(sizeInPixels, columnSettings.minSize)
                    } else {
                        distributedSizing[columnId] = 0
                    }
                } else {
                    if (typeof columnSettings.size === 'string') {
                        const sizeInPixels = convertPercentToPixels(columnSettings.size, tableWidth)
                        distributedSizing[columnId] = Math.max(sizeInPixels, columnSettings.minSize)
                    } else if (typeof columnSettings.size === 'number') {
                        distributedSizing[columnId] = Math.max(columnSettings.size, columnSettings.minSize)
                    }
                }
            })
            
            const newSizing = typeof updater === 'function' ? updater(distributedSizing) : updater
            
            const newSettings = { ...prevSettings }
            Object.entries(newSizing).forEach(([columnId, size]) => {
                if (newSettings[columnId]) {
                    const clampedSize = Math.max(size, prevSettings[columnId].minSize)
                    
                    newSettings[columnId] = {
                        ...newSettings[columnId],
                        size: clampedSize,
                    }
                }
            })
            
            return newSettings
        })
    }, [setSettings, tableWidth])

    return {
        columnSizing,
        onColumnSizingChange,
    }
}
