import { RowData, AccessorFn, SortingState, ColumnMeta } from '@tanstack/react-table'

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
    minSize?: string  // '10px'
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
    minSize?: string  // '10px'
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
    filterFns?: Record<string, (row: TData, columnId: string, filterValue: unknown) => boolean>
    storageKey?: string
    loading?: boolean
    columnMenuLabels?: TableColumnMenuLabels
    defaultColumn?: DefaultColumn
    onRowClick?: (record: TData) => void
}

export type GetData<TData> = (tableParams: TableParams<TData>) => void

type TableParams<TData> = {
    // Details for the request. A simple object that can be converted to JSON.
    request: TableParamsRequest
    // Success callback, pass the rows back to the grid that were requested.
    success(params: LoadSuccessParams<TData>): void
    // Fail callback, tell the grid the call failed so it can adjust it's state.
    fail(): void
}

type TableParamsRequest = {
    // First row requested or undefined for all rows. 
    startRow: number  |  undefined
    // Index after the last row required row or undefined for all rows. 
    endRow: number  |  undefined

    // filterModel: FilterModel  |  AdvancedFilterModel  |  null; - Пока что думаю...
    filterModel: FilterModel
    // If sorting, what the sort model is.  
    sortModel: SortingState
}

export type FilterModel = {
    [colId: string]: unknown
}

type LoadSuccessParams<TData extends RowData = RowData> = {
    // Data retrieved from the server as requested by the grid.
    rowData: TData[]
    // The last row, if known, to help Infinite Scroll.
    rowCount?: number
}

