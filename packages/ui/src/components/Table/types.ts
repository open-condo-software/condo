import { RowData, AccessorFn } from '@tanstack/react-table'

export type ColumnSettings = {
    visibility: boolean
    order: number
}

export type TableSettings<TData extends RowData = RowData> = Record<TableColumn<TData>['id'], ColumnSettings>

export type TableState = {
    columnVisibility: Record<string, boolean>
    columnSizing: Record<string, number>
    columnOrder: TableColumn<RowData>['dataKey'][]
}

export type TableColumn<TData extends RowData = RowData> = {
    render?: (value: any) => React.ReactNode
    header: string
    dataKey: AccessorFn<TData, any> | string
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
    onRowClick?: (record: TData) => void
}