import { RowData, DeepKeys, SortingState, Table, ColumnDef } from '@tanstack/react-table'

export type ColumnSettings = {
    visibility: boolean
    order: number
    size: number | string
}

export type TableSettings<TData extends RowData = RowData> = Record<TableColumn<TData>['id'], ColumnSettings>

export type ColumnDefWithId<TData extends RowData = RowData> = 
    ColumnDef<TData, unknown> & { id: string }

export type TableColumnMenuLabels = {
    sortDescLabel?: string
    sortAscLabel?: string
    filterLabel?: string
    settingsLabel?: string
    sortedDescLabel?: string
    sortedAscLabel?: string
    filteredLabel?: string
    settedLabel?: string
    noData?: string
    defaultSettingsLabel?: string
    resetFilterLabel?: string
}

export type DefaultColumn = {
    enableSorting?: boolean
    enableColumnSettings?: boolean
    initialVisibility?: boolean
    initialSize?: string | number
}

export type RowSelectionState = string[]

export type RowSelectionOptions<TData> = {
    getRowId: (row: TData) => string
    onRowSelectionChange: (rowSelectionState: RowSelectionState) => void
}

export type FilterComponentProps = {
    setFilterValue: (value: unknown) => void
    filterValue: unknown
    confirm: (opts?: { closeDropdown?: boolean }) => void
    setShowResetButton: (showResetButton: boolean) => void
    clearFilters: () => void
}

export type FilterComponentKey =
    | 'textColumnFilter'
    | 'selectColumnFilter'
    | 'checkboxGroupColumnFilter'

export type FilterConfig = {
    key: FilterComponentKey
    componentProps?: Record<string, unknown>
}

export type FilterComponent = (props: FilterComponentProps) => React.ReactNode

export type TableColumnMeta = {
    filterComponent?: FilterComponent
    enableColumnSettings: boolean
    enableColumnOptions?: boolean
    initialVisibility: boolean
    initialSize: string | number
    initialOrder?: number
}

export type TableColumn<TData extends RowData = RowData> = {
    id: string
    header: string | ((table: Table<TData>) => React.ReactNode)
    dataKey: DeepKeys<TData>
    render?: (value: unknown, record: TData, index: number) => React.ReactNode
    filterComponent?: FilterConfig | FilterComponent
    enableSorting?: boolean
    enableColumnSettings?: boolean
    initialVisibility?: boolean
    initialSize?: string | number
    initialOrder?: number
    minSize?: number
}

export type TableState = {
    startRow: number
    endRow?: number
    filterState: FilterState
    sortState: SortState
}

export type FilterState = {
    [colId: string]: unknown
}

export type SortState = SortingState

export type FullTableState = TableState & {
    rowSelectionState: RowSelectionState
}

export type TableApi = {
    setFilterState: (filterState: FilterState) => void
    getFilterState: () => FilterState
    setColumnFilter: (columnId: string, value: unknown) => void
    getColumnFilter: (columnId: string) => unknown
    refetchData: () => Promise<void>
    setPagination: ({ startRow, endRow }: { startRow: number, endRow: number }) => void
    getPagination: () => { startRow: number, endRow: number }
    setSorting: (sorting: SortState) => void
    getSorting: () => SortState
    getRowSelection: () => string[]
    resetRowSelection: () => void
}

export type TableRef = { api: TableApi }

export type GetTableData<TData extends RowData = RowData> = (tableState: TableState, isRefetch?: boolean) => Promise<{ rowData: TData[], rowCount: number }>

export interface TableProps<TData extends RowData = RowData> {
    id: string
    dataSource: GetTableData<TData>
    columns: TableColumn<TData>[]
    defaultColumn?: DefaultColumn
    pageSize?: number
    onTableStateChange?: (tableState: FullTableState) => void
    initialTableState?: FullTableState
    storageKey?: string
    columnMenuLabels?: TableColumnMenuLabels
    onRowClick?: (record: TData) => void
    rowSelectionOptions?: RowSelectionOptions<TData>
    onGridReady?: (tableRef: TableRef) => void
}
