import { ColumnSizingState, RowData } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { TableSettings } from '../types'

interface UseColumnSizingProps<TData extends RowData = RowData> {
    settings: TableSettings<TData>
    setSettings: React.Dispatch<React.SetStateAction<TableSettings<TData>>>
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

const convertSizeToPercent = (sizeInPixels: number, tableWidth: number): string => {
    if (tableWidth === 0) return '0%'
    const percent = (sizeInPixels / tableWidth) * 100
    return `${percent}%`
}

const distributeRemainingSpace = (
    columnSizing: ColumnSizingState,
    tableWidth: number,
    allColumnIds: string[]
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
    }

    return columnSizing
}

export const useColumnSizing = <TData extends RowData = RowData>({ 
    settings, 
    setSettings, 
}: UseColumnSizingProps<TData>): {
    columnSizing: ColumnSizingState
    onColumnSizingChange: (updater: React.SetStateAction<ColumnSizingState>) => void
} => {
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

        visibleColumnIds.forEach((columnId) => {
            const columnSettings = settings[columnId]

            if (typeof columnSettings.size === 'string') {
                const sizeInPixels = convertPercentToPixels(columnSettings.size, tableWidth)
                sizes[columnId] = sizeInPixels
            } else if (typeof columnSettings.size === 'number') {
                sizes[columnId] = columnSettings.size
            } else {
                sizes[columnId] = 0
            }
        })

        const result = distributeRemainingSpace(sizes, tableWidth, visibleColumnIds)
        
        hiddenColumnIds.forEach((columnId) => {
            const columnSettings = settings[columnId]
            
            if (columnSettings?.size === 0) {
                if (tableWidth > 0) {
                    const sizeInPixels = (tableWidth * 10) / 100
                    result[columnId] = sizeInPixels
                }
                result[columnId] = 0
            } else {
                if (typeof columnSettings?.size === 'string') {
                    const sizeInPixels = convertPercentToPixels(columnSettings.size, tableWidth)
                    result[columnId] = sizeInPixels
                } else if (typeof columnSettings?.size === 'number') {
                    result[columnId] = columnSettings.size
                }
            }
        })
        
        return result
    }, [settings, tableWidth])

    const onColumnSizingChange = useCallback((updater: React.SetStateAction<ColumnSizingState>) => {
        setSettings((prevSettings: TableSettings<TData>) => {
            const currentSizing: ColumnSizingState = {}
            const allColumnIds = Object.keys(prevSettings)
            
            const visibleColumnIds = allColumnIds.filter(
                columnId => prevSettings[columnId]?.visibility !== false
            )
            const hiddenColumnIds = allColumnIds.filter(
                columnId => prevSettings[columnId]?.visibility === false
            )
            
            visibleColumnIds.forEach((columnId) => {
                const columnSettings = prevSettings[columnId]
                if (typeof columnSettings.size === 'string') {
                    const sizeInPixels = convertPercentToPixels(columnSettings.size, tableWidth)
                    currentSizing[columnId] = sizeInPixels
                } else if (typeof columnSettings.size === 'number') {
                    currentSizing[columnId] = columnSettings.size
                } else {
                    currentSizing[columnId] = 0
                }
            })
            
            const distributedSizing = distributeRemainingSpace(currentSizing, tableWidth, visibleColumnIds)
            
            hiddenColumnIds.forEach((columnId) => {
                const columnSettings = prevSettings[columnId]
                
                if (columnSettings?.size === 0) {
                    if (tableWidth > 0) {
                        const sizeInPixels = (tableWidth * 10) / 100
                        distributedSizing[columnId] = sizeInPixels
                    }
                    distributedSizing[columnId] = 0
                } else {
                    if (typeof columnSettings.size === 'string') {
                        const sizeInPixels = convertPercentToPixels(columnSettings.size, tableWidth)
                        distributedSizing[columnId] = sizeInPixels
                    } else if (typeof columnSettings.size === 'number') {
                        distributedSizing[columnId] = columnSettings.size
                    }
                }
            })
            
            const newSizing = typeof updater === 'function' ? updater(distributedSizing) : updater
            
            const newSettings = { ...prevSettings }
            Object.entries(newSizing).forEach(([columnId, size]) => {
                if (newSettings[columnId] && typeof size === 'number') {
                    const originalSize = prevSettings[columnId]?.size
                    
                    if (typeof originalSize === 'number') {
                        newSettings[columnId] = {
                            ...newSettings[columnId],
                            size: size,
                        }
                    } else {
                        const sizeInPercent = convertSizeToPercent(size, tableWidth)
                        newSettings[columnId] = {
                            ...newSettings[columnId],
                            size: sizeInPercent,
                        }
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
