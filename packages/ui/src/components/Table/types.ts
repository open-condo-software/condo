import { RowData, AccessorFn, SortingState } from '@tanstack/react-table'

export type ColumnSettings = {
    visibility: boolean
    order: number
    size: number
}

export type TableSettings<TData extends RowData = RowData> = Record<TableColumn<TData>['id'], ColumnSettings>

export type TableColumnMenuLabels = {
    sortDescLabel?: string
    sortAscLabel?: string
    filterLabel?: string
    settingsLabel?: string
    sortedLabel?: string
    sortedDescLabel?: string
    sortedAscLabel?: string
    filteredLabel?: string
    settedLabel?: string
}

export type DefaultColumn = {
    enableSorting?: boolean
    enableFilter?: boolean
    enableColumnSettings?: boolean
    initialVisibility?: boolean
    initialSize?: string  // '150px' or '15%'?
}

export type FilterDropdownProps = {
    setFilterValue: (old: unknown) => void
    filterValue: unknown
}

export type TableColumn<TData extends RowData = RowData> = {
    id: string
    header: string
    dataKey: AccessorFn<TData> | string
    render?: (value: unknown, record: TData, index: number) => React.ReactNode
    filterComponent?: ((props: FilterDropdownProps) => React.ReactNode)
    enableSorting?: boolean
    enableFilter?: boolean
    enableColumnSettings?: boolean
    initialVisibility?: boolean
    initialSize?: string  // '150px' or '15%'?
    initialOrder?: number
}

export type TableState = {
    startRow: number
    endRow: number
    filterState: FilterState
    sortState: SortingState
}

export type FilterState = {
    [colId: string]: unknown
}

export type GetTableData<TData extends RowData = RowData> = (tableState: TableState) => Promise<TData[]>

export interface TableProps<TData extends RowData = RowData> {
    id: string
    dataSource: GetTableData<TData>
    columns: TableColumn<TData>[]
    defaultColumn?: DefaultColumn
    totalRows?: number
    pageSize?: number
    onTableStateChange?: (tableState: TableState) => Promise<void> | void
    initialTableState?: TableState
    storageKey?: string
    // loading?: boolean We don't need it, if we have dataSource prop
    columnMenuLabels?: TableColumnMenuLabels
    onRowClick?: (record: TData) => void
    // Add prop for refresh table data
}

// Как лучше в localhoste хранить?
