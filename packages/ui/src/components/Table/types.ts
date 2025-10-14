import { RowData, AccessorFn, SortingState, ColumnMeta, FilterFn } from '@tanstack/react-table'

export type ColumnSettings = {
    visibility: boolean
    order: number
    size?: number  // 150
}

export type TableSettings<TData extends RowData = RowData> = Record<TableColumn<TData>['id'], ColumnSettings>

export type TableColumnMenuLabels = {
    sortLabel?: string
    filterLabel?: string
    settingsLabel?: string
    sortedLabel?: string
    filteredLabel?: string
    settedLabel?: string
}

export type DefaultColumn = {
    enableSorting?: boolean
    enableFilter?: boolean
    initialVisibility?: boolean
    initialSize?: string  // '150px'
}

export type FilterDropdownProps = {
    setFilterValue: (old: unknown) => void
    filterValue: unknown
}

export type TableColumnMeta<TData extends RowData = RowData> = ColumnMeta<TData, unknown> & {
    filterComponent?: ((props: FilterDropdownProps) => React.ReactNode)
    filterFn?: string | ((row: { getValue: (columnId: string) => unknown }, columnId: string, filterValue: unknown) => boolean | string)
}

export type TableColumn<TData extends RowData = RowData> = {
    render?: (value: unknown, record: TData, index: number) => React.ReactNode
    header: string
    dataKey: AccessorFn<TData> | string
    id: string
    enableSorting?: boolean
    meta?: TableColumnMeta<TData>
    initialVisibility?: boolean
    initialSize?: string  // '150px'
    initialOrder?: number
}

export interface TableProps<TData extends RowData = RowData> {
    dataSource: TData[] | GetData<TData>
    columns: Array<TableColumn<TData>>
    id: string
    totalRows?: number
    pageSize?: number
    syncUrlConfig?: {
        hasSyncUrl: boolean
    }
    filterFns?: Record<string, FilterFn<TData>>
    storageKey?: string
    loading?: boolean
    columnMenuLabels?: TableColumnMenuLabels
    defaultColumn?: DefaultColumn
    onRowClick?: (record: TData) => void
}

export type GetData<TData> = (tableParams: TableParams<TData>) => void

type TableParams<TData> = {
    request: TableParamsRequest
    success(params: LoadSuccessParams<TData>): void
    fail(): void
}

type TableParamsRequest = {
    startRow: number  |  undefined
    endRow: number  |  undefined
    filterModel: FilterModel
    sortModel: SortingState
}

export type FilterModel = {
    [colId: string]: unknown
}

type LoadSuccessParams<TData extends RowData = RowData> = {
    rowData: TData[]
    rowCount?: number
}

