import {
    ColumnDef,
    ColumnOrderState,
    ColumnSizingState,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table'
import debounce from 'lodash/debounce'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { MoreVertical } from '@open-condo/icons'
import { Button, Checkbox, Dropdown } from '@open-condo/ui'


const getStorage = (key: string) => {
    if (typeof window === 'undefined') return null
    try {
        const saved = localStorage.getItem(key)
        return saved ? JSON.parse(saved) : null
    } catch {
        return null
    }
}

const saveStorage = (key: string, data: any): void => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(key, JSON.stringify(data))
    } catch {
        // Ignore localStorage errors
    }
}

type ColumnSettings = {
    visibility: boolean
    size?: number
    order: number
}

type TableSettings = Record<string, ColumnSettings>

type TableState = {
    columnVisibility: VisibilityState
    columnSizing: ColumnSizingState
    columnOrder: ColumnOrderState
}

interface UsePersistentTableStateProps<T> {
    storageKey: string
    columns: Array<TableColumn<T>>
}

const useTableState = ({ storageKey, columns }: UsePersistentTableStateProps<any>) => {
    const getInitialState = useCallback((): TableSettings => {
        const savedState = getStorage(storageKey)

        if (savedState) {
            return savedState
        }

        const initialState: TableSettings = columns.reduce((acc, col, index) => {
            acc[col.key] = {
                visibility: col.initialVisibility ?? true,
                size: col.width,
                order: index,
            }
            return acc
        }, {} as TableSettings)

        return initialState
    }, [columns, storageKey])

    const [settings, setSettings] = useState<TableSettings>(getInitialState)

    const debouncedSave = useMemo(
        () => debounce((state: TableSettings) => saveStorage(storageKey, state), 300),
        [storageKey]
    )

    useEffect(() => {
        debouncedSave(settings)
    }, [settings, debouncedSave])

    const tableState = useMemo<TableState>(() => {
        const columnVisibility: VisibilityState = {}
        const columnSizing: ColumnSizingState = {}

        const orderedColumns: ColumnOrderState = Object.entries(settings)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([key]) => key)

        for (const key in settings) {
            const columnSettings = settings[key]
            if (columnSettings) {
                if (typeof columnSettings.visibility === 'boolean') {
                    columnVisibility[key] = columnSettings.visibility
                }
                if (typeof columnSettings.size === 'number') {
                    columnSizing[key] = columnSettings.size
                }
            }
        }

        return {
            columnVisibility,
            columnSizing,
            columnOrder: orderedColumns,
        }
    }, [settings])

    const updateSetting = useCallback(
        (updater: React.SetStateAction<any>, tableStateValue: any, settingKey: string) => {
            const newValues = typeof updater === 'function' ? updater(tableStateValue) : updater
            setSettings(prev => {
                const newSettings = { ...prev }
                for (const key in newValues) {
                    const existing = newSettings[key] || {}
                    newSettings[key] = {
                        ...existing,
                        order: existing.order ?? Object.keys(newSettings).length,
                        visibility: existing.visibility ?? true,
                        [settingKey]: newValues[key],
                    }
                }
                return newSettings
            })
        }, []
    )

    const onColumnVisibilityChange = useCallback((updater: React.SetStateAction<VisibilityState>) => {
        updateSetting(updater, tableState.columnVisibility, 'visibility')
    }, [tableState.columnVisibility, updateSetting])

    const onColumnSizingChange = useCallback((updater: React.SetStateAction<ColumnSizingState>) => {
        updateSetting(updater, tableState.columnSizing, 'size')
    }, [tableState.columnSizing, updateSetting])


    const onColumnOrderChange = useCallback((updater: React.SetStateAction<ColumnOrderState>) => {
        const newOrder = typeof updater === 'function' ? updater(tableState.columnOrder) : updater
        setSettings(prev => {
            const newSettings: TableSettings = { ...prev }
            newOrder.forEach((key, index) => {
                if (newSettings[key]) {
                    newSettings[key].order = index
                }
            })
            return newSettings
        })
    }, [tableState.columnOrder])

    return {
        ...tableState,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
    }
}

type TableColumn<T> = ColumnDef<T> & {
    key: string
    title: React.ReactNode | string
    sorter?: boolean
    width?: number
    initialVisibility?: boolean
}

export interface TableProps<T> {
    totalRows: number
    dataSource: Array<T>
    columns: Array<TableColumn<T>>
    storageKey?: string
    loading?: boolean
    onRow?: (record: T) => void
    sorting: SortingState
    onSortingChange: (sorting: SortingState) => void
    pagination: PaginationState
    onPaginationChange: (pagination: PaginationState) => void
}

export function Table<T extends { [key: string]: any }> ({
    totalRows,
    dataSource,
    columns,
    storageKey = 'table-state',
    loading,
    onRow,
    sorting,
    onSortingChange,
    pagination,
    onPaginationChange,
}: TableProps<T>): React.ReactElement {
    const {
        columnVisibility,
        columnOrder,
        columnSizing,
        onColumnVisibilityChange,
        onColumnOrderChange,
        onColumnSizingChange,
    } = useTableState({ storageKey, columns })

    const columnHelper = createColumnHelper<T>()

    const columnsDefinitions = useMemo(() =>
        columns.map(column =>
            columnHelper.accessor(column.key as any, { // eslint-disable-line
                id: column.key,
                header: column.title as ColumnDef<T>['header'],
                cell: info => info.getValue(),
                ...column,
            })
        ), [columns, columnHelper])


    const table = useReactTable({
        data: dataSource || [],
        columns: columnsDefinitions,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualSorting: true,
        manualPagination: true,
        pageCount: Math.ceil(totalRows / pagination.pageSize),
        state: {
            pagination,
            sorting,
            columnVisibility,
            columnSizing,
            columnOrder,
        },
        onPaginationChange: (updater) => {
            const newPagination = typeof updater === 'function' ? updater(pagination) : updater
            onPaginationChange(newPagination)
        },
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater
            onSortingChange(newSorting)
        },
        onColumnVisibilityChange: onColumnVisibilityChange,
        onColumnOrderChange: onColumnOrderChange,
        onColumnSizingChange: onColumnSizingChange,
        // enableColumnResizing: true,
        // columnResizeMode: 'onChange',
    })

    if (loading) {
        return <div>Loading...</div>
    }

    const ColumnVisibilityControls = () => (
        <div className='condo-table-column-visibility-controls'>
            <div className='condo-table-column-visibility-inner'>
                <span className='condo-table-column-visibility-label'>Columns:</span>
                {columns.map((column) => {
                    const isVisible = table.getColumn(column.key)?.getIsVisible()
                    return (
                        <Checkbox
                            key={column.key}
                            checked={isVisible}
                            onChange={(e) => {
                                table.getColumn(column.key)?.toggleVisibility(e.target.checked)
                            }}
                        >
                            {column.title}
                        </Checkbox>
                    )
                })}
            </div>
        </div>
    )

    const PaginationControls = () => {
        const pageCount = table.getPageCount()
        if (pageCount <= 1) return null

        return (
            <div className='condo-table-pagination-container'>
                <div className='condo-table-pagination-info'>
                    Showing {pagination.pageIndex * pagination.pageSize + 1} -{' '}
                    {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)} of {totalRows}
                </div>
                <div className='condo-table-pagination-controls'>
                    <Button
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        type='secondary'
                    >
                        {'<<'}
                    </Button>
                    <Button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        type='secondary'
                    >
                        {'<'}
                    </Button>
                    <span className='condo-table-pagination-info-text'>
                        Page {pagination.pageIndex + 1} of {pageCount}
                    </span>
                    <Button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        type='secondary'
                    >
                        {'>'}
                    </Button>
                    <Button
                        onClick={() => table.setPageIndex(pageCount - 1)}
                        disabled={!table.getCanNextPage()}
                        type='secondary'
                    >
                        {'>>'}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className='condo-table-wrapper'>
            <ColumnVisibilityControls />
            <div className='condo-table-container'>
                <table className='condo-table'>
                    <thead className='condo-table-thead'>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    const dropdown = [
                                        {
                                            title: 'Сортировать по возрастанию',
                                            key: 'sort-asc',
                                            // disabled: !header.column.getCanSort(),
                                            onClick: () => header.column.toggleSorting(false),
                                        },
                                        {
                                            title: 'Сортировать по убыванию',
                                            key: 'sort-desc',
                                            // disabled: !header.column.getCanSort(),
                                            onClick: () => header.column.toggleSorting(true),
                                        },
                                        {
                                            title: 'Фильтровать',
                                            key: 'filter',
                                            // onClick: () => header.column.toggleFilter(),
                                        },
                                        {
                                            title: 'Настроить колонки',
                                            key: 'settings',
                                            // onClick: () => header.column.toggleSettings(),
                                        },
                                    ]

                                    return (
                                        <th
                                            key={header.id}
                                            className='condo-table-th'
                                            style={{ width: header.getSize() }}
                                        >
                                            <div className='condo-table-th-content'>
                                                <div className='condo-table-th-title-content'>
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </div>
                                                <Dropdown
                                                    mouseLeaveDelay={0.5}
                                                    menu={{ items: dropdown }}
                                                    overlayClassName='condo-table-header-dropdown'
                                                    trigger={['hover']}
                                                >
                                                    <div className='condo-table-th-more-icon'>
                                                        <MoreVertical size='small' />
                                                    </div>
                                                </Dropdown>
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className='condo-table-tbody'>
                        {table.getRowModel().rows.map(row => (
                            <tr
                                key={row.id}
                                className='condo-table-tr'
                                onClick={() => onRow && onRow(row.original)}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td
                                        key={cell.id}
                                        className='condo-table-td'
                                        style={{ width: cell.column.getSize() }}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationControls />
        </div>
    )
}
