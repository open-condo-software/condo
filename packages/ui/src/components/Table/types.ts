import { RowData, AccessorFn } from '@tanstack/react-table'

export type ColumnSettings = {
    visibility: boolean
    order: number
}

export type TableSettings<TData extends RowData = RowData> = Record<TableColumn<TData>['id'], ColumnSettings>

export type TableColumnMenuLabels = {
    sortLabel?: string
    filterLabel?: string
    settingsLabel?: string
}

export type TableColumn<TData extends RowData = RowData> = {
    render?: (value: unknown) => React.ReactNode
    header: string
    dataKey: AccessorFn<TData> | string
    id: string
    initialVisibility?: boolean
    initialSize?: number
    initialOrder?: number
}

export interface TableProps<TData extends RowData = RowData> {
    dataSource: Array<TData>
    columns: Array<TableColumn<TData>>
    storageKey?: string
    loading?: boolean
    id: string
    columnMenuLabels?: TableColumnMenuLabels
    onRowClick?: (record: TData) => void
}