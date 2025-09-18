import React from 'react'

export type ColumnSettings = {
    visibility: boolean
    size?: number
    order: number
    isPercentage?: boolean
}

export type TableSettings = Record<string, ColumnSettings>

export type TableState = {
    columnVisibility: Record<string, boolean>
    columnSizing: Record<string, number>
    columnOrder: string[]
}

export type TableColumn = {
    key: string
    initialVisibility?: boolean
    initialSize?: number
    initialOrder?: number
    initialWidth?: number
    width?: number
    header?: string | React.ReactNode
    cell?: (info: Record<string, unknown>) => React.ReactNode
    size?: number
}
