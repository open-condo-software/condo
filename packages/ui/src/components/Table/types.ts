import { RowData, AccessorFn, SortingState, RowSelectionState, Table } from '@tanstack/react-table'

export type ColumnSettings = {
    visibility: boolean
    order: number
    size: number | string
}

export type TableSettings<TData extends RowData = RowData> = Record<TableColumn<TData>['id'], ColumnSettings>

export type TableColumnMenuLabels = {
    sortDescLabel?: string
    sortAscLabel?: string
    filterLabel?: string
    settingsLabel?: string
    sortedDescLabel?: string
    sortedAscLabel?: string
    filteredLabel?: string
    settedLabel?: string
}

export type DefaultColumn = {
    enableSorting?: boolean
    enableColumnSettings?: boolean
    initialVisibility?: boolean
    initialSize?: string | number
}

export type RowSelection<TData> = {
    getRowId: (row: TData) => string
}

export type FilterDropdownProps = {
    setFilterValue: (old: unknown) => void
    filterValue: unknown
}   

type FilterComponent = (props: FilterDropdownProps) => React.ReactNode

export type TableColumnMeta = {
    filterComponent?: FilterComponent
    enableColumnSettings?: boolean
    enableColumnOptions?: boolean
}

export type TableColumn<TData extends RowData = RowData> = {
    id: string
    header: string | ((table: Table<TData>) => React.ReactNode)
    dataKey: string | AccessorFn<TData>
    render?: (value: unknown, record: TData, index: number) => React.ReactNode
    filterComponent?: FilterComponent
    enableSorting?: boolean
    enableColumnSettings?: boolean
    initialVisibility?: boolean
    initialSize?: string | number
    initialOrder?: number
}

export type TableState = {
    startRow: number
    endRow?: number
    filterState: FilterState
    sortState: SortingState
}

export type FilterState = {
    [colId: string]: unknown
}

export type FullTableState = TableState & {
    rowSelection?: RowSelectionState
}

export type TableApi = {
    setFilterState: (filterState: FilterState) => void
    getFilterState: () => FilterState
    setColumnFilter: (columnId: string, value: unknown) => void
    getColumnFilter: (columnId: string) => unknown
    refresh: () => void
    setSorting: (sorting: SortingState) => void
    getSorting: () => SortingState
}

export type TableRef = { api: TableApi }

export type GetTableData<TData extends RowData = RowData> = (tableState: TableState) => Promise<{ rowData: TData[], rowCount: number }>

export interface TableProps<TData extends RowData = RowData> {
    id: string
    dataSource: GetTableData<TData>
    columns: TableColumn<TData>[]
    defaultColumn?: DefaultColumn
    pageSize?: number
    onTableStateChange?: (tableState: FullTableState) => void
    initialTableState?: FullTableState
    storageKey?: string
    // loading?: boolean - We don't need it, if we have dataSource prop
    columnMenuLabels?: TableColumnMenuLabels
    onRowClick?: (record: TData) => void
    rowSelectionOptions?: RowSelection<TData>
    // Add prop for refresh table data
}
