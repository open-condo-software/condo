import { RowData, DeepKeys, SortingState, Table, ColumnDef, CoreOptions } from '@tanstack/react-table'
import '@tanstack/react-table'

import type { 
    TextColumnFilterConfig, 
    SelectColumnFilterConfig, 
    CheckboxGroupColumnFilterConfig,
} from './utils/filterComponents'
import type { ReactNode } from 'react'

export type ColumnSettings = {
    visibility: boolean
    order: number
    size: number | string
    minSize: number
}

export type TableSettings<TData extends RowData = RowData> = Record<TableColumn<TData>['id'], ColumnSettings>

export type ColumnDefWithId<TData extends RowData = RowData, TValue = unknown> = 
    ColumnDef<TData, TValue> & { id: string } 

export type TableLabels = {
    sortDescLabel?: string
    sortAscLabel?: string
    filterLabel?: string
    settingsLabel?: string
    sortedDescLabel?: string
    sortedAscLabel?: string
    filteredLabel?: string
    noDataLabel?: string
    defaultSettingsLabel?: string
    resetFilterLabel?: string
}

export type DefaultColumn = {
    enableSorting?: boolean
    enableColumnSettings?: boolean
    enableColumnResize?: boolean
    initialVisibility?: boolean
    initialSize?: string | number
    minSize?: number
}

export type RowSelectionState = string[]

export type RowSelectionOptions = {
    enableRowSelection: boolean
    onRowSelectionChange?: (rowSelectionState: RowSelectionState) => void
}

export type FilterComponentProps = {
    setFilterValue: (value: unknown) => void
    filterValue: unknown
    confirm: (opts?: { closeDropdown?: boolean }) => void
    setShowResetButton: (showResetButton: boolean) => void
    clearFilters: () => void
}

export type FilterConfig = 
    | TextColumnFilterConfig
    | SelectColumnFilterConfig
    | CheckboxGroupColumnFilterConfig

export type FilterComponent = (props: FilterComponentProps) => ReactNode

export type TableColumnMeta = {
    filterComponent?: FilterComponent
    enableColumnSettings?: boolean
    enableColumnMenu?: boolean
    enableColumnResize?: boolean
    initialVisibility?: boolean
    initialSize?: string | number
    initialOrder?: number
}

type TableColumnBase<TData extends RowData = RowData> = {
    id: string
    header: string | ((table: Table<TData>) => ReactNode)
    filterComponent?: FilterConfig | FilterComponent
    enableSorting?: boolean
    enableColumnSettings?: boolean
    enableColumnResize?: boolean
    initialVisibility?: boolean
    initialSize?: string | number
    initialOrder?: number
    minSize?: number
}

export type RenderTableCell<TData extends RowData = RowData, TValue = unknown> = (value: TValue, record: TData, index: number, globalFilter?: string) => ReactNode

export type TableColumn<TData extends RowData = RowData> = 
    | (TableColumnBase<TData> & {
        dataKey: DeepKeys<TData>
        render?: RenderTableCell<TData>
    })
    | (TableColumnBase<TData> & {
        dataKey?: never
        render: RenderTableCell<TData>
    })

export type TableState = {
    startRow: number
    endRow?: number
    filterState: FilterState
    sortState: SortState
    globalFilter?: string
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
    setGlobalFilter: (globalFilter: string) => void
    getGlobalFilter: () => string | undefined
    refetchData: () => Promise<void>
    setPagination: ({ startRow, endRow }: { startRow: number, endRow: number }) => void
    getPagination: () => { startRow: number, endRow: number }
    setSorting: (sorting: SortState) => void
    getSorting: () => SortState
    getRowSelection: () => string[]
    resetRowSelection: () => void
    getFullTableState: () => FullTableState
    setFullTableState: (tableState: FullTableState) => void
}

export type TableRef = { api: TableApi }

export type GetTableData<TData extends RowData = RowData> = (tableState: TableState, isRefetch?: boolean) => Promise<{ rowData: TData[], rowCount: number }>

export interface TableProps<TData extends RowData = RowData> {
    id: string
    dataSource: GetTableData<TData>
    columns: TableColumn<TData>[]
    getRowId?: CoreOptions<TData>['getRowId']
    defaultColumn?: DefaultColumn
    pageSize?: number
    onTableStateChange?: (tableState: FullTableState) => void
    initialTableState?: FullTableState
    storageKey?: string
    columnLabels?: TableLabels
    onRowClick?: (record: TData) => void
    rowSelectionOptions?: RowSelectionOptions
    onTableReady?: (tableRef: TableRef) => void
}

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> extends TableColumnMeta {}
}