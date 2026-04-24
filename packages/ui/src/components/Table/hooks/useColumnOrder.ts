import { ColumnOrderState, RowData } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import type { TableSettings, TableColumn } from '../types'
import type { Dispatch, SetStateAction } from 'react'

interface UseColumnOrderProps<TData extends RowData = RowData> {
    settings: TableSettings<TData>
    setSettings: Dispatch<SetStateAction<TableSettings<TData>>>
}

type ColumnOrderResult = {
    columnOrder: ColumnOrderState
    onColumnOrderChange: (updater: SetStateAction<ColumnOrderState>) => void
}


export const useColumnOrder = <TData extends RowData = RowData>({ 
    settings, 
    setSettings,
}: UseColumnOrderProps<TData>): ColumnOrderResult  => {
    
    const columnOrder = useMemo(() => {
        return Object.entries(settings)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([key]) => key)
    }, [settings])

    const onColumnOrderChange = useCallback((updater: SetStateAction<ColumnOrderState>) => {
        setSettings((prevSettings: TableSettings<TData>) => {
            const prevOrder = Object.entries(prevSettings)
                .sort(([, a], [, b]) => a.order - b.order)
                .map(([key]) => key)

            const newOrder = typeof updater === 'function' ? updater(prevOrder) : updater

            const newSettings = { ...prevSettings }
            newOrder.forEach((key, index) => {
                if (newSettings[key as TableColumn<TData>['id']]) {
                    newSettings[key as TableColumn<TData>['id']] = {
                        ...newSettings[key as TableColumn<TData>['id']],
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
