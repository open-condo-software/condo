import { 
    createColumnHelper, 
    flexRender, 
    getCoreRowModel, 
    useReactTable, 
    getSortedRowModel, 
    SortingState, 
    VisibilityState, 
    // ColumnResizeMode,
    ColumnSizingState, 
    ColumnOrderState,
} from '@tanstack/react-table'
import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import {
    Button,
    Checkbox,
} from '@open-condo/ui'

import { updateQuery } from '@condo/domains/common/utils/helpers'
import {
    getPageIndexFromOffset,
    parseQuery,
    FULL_TO_SHORT_ORDERS_MAP,
} from '@condo/domains/common/utils/tables.utils'

import styles from './TanStackTable.module.css'


const DEFAULT_PAGE_SIZE = 30


// Утилиты для управления состоянием колонок
const COLUMN_VISIBILITY_STORAGE_KEY = 'ticket-table-column-visibility'
const COLUMN_SIZING_STORAGE_KEY = 'ticket-table-column-sizing'
const COLUMN_ORDER_STORAGE_KEY = 'ticket-table-column-order'

// Получить начальное состояние видимости колонок
const getInitialColumnVisibility = (): VisibilityState => {
    if (typeof window === 'undefined') return {}
    
    try {
        const saved = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY)
        return saved ? JSON.parse(saved) : {}
    } catch {
        return {}
    }
}

// Сохранить состояние видимости колонок
const saveColumnVisibility = (visibility: VisibilityState) => {
    if (typeof window === 'undefined') return
    
    try {
        localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(visibility))
    } catch {
        // Игнорируем ошибки localStorage
    }
}

// Получить начальное состояние размера колонок
const getInitialColumnSizing = (): ColumnSizingState => {
    if (typeof window === 'undefined') return {}
    
    try {
        const saved = localStorage.getItem(COLUMN_SIZING_STORAGE_KEY)
        return saved ? JSON.parse(saved) : {}
    } catch {
        return {}
    }
}

// Сохранить состояние размера колонок
const saveColumnSizing = (sizing: ColumnSizingState) => {
    if (typeof window === 'undefined') return
    
    try {
        localStorage.setItem(COLUMN_SIZING_STORAGE_KEY, JSON.stringify(sizing))
    } catch {
        // Игнорируем ошибки localStorage
    }
}

// Получить начальное состояние порядка колонок
const getInitialColumnOrder = (): ColumnOrderState => {
    if (typeof window === 'undefined') return []
    
    try {
        const saved = localStorage.getItem(COLUMN_ORDER_STORAGE_KEY)
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}

// Сохранить состояние порядка колонок
const saveColumnOrder = (order: ColumnOrderState) => {
    if (typeof window === 'undefined') return
    
    try {
        localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(order))
    } catch {
        // Игнорируем ошибки localStorage
    }
}

// Интерфейс для объединенного состояния таблицы
interface TableState {
    columnVisibility: VisibilityState
    columnSizing: ColumnSizingState
    columnOrder: ColumnOrderState
}

// Получить начальное состояние таблицы
const getInitialTableState = (): TableState => ({
    columnVisibility: getInitialColumnVisibility(),
    columnSizing: getInitialColumnSizing(),
    columnOrder: getInitialColumnOrder(),
})

// Сохранить состояние таблицы
const saveTableState = (state: TableState) => {
    if (typeof window === 'undefined') return
    
    try {
        saveColumnVisibility(state.columnVisibility)
        saveColumnSizing(state.columnSizing)
        saveColumnOrder(state.columnOrder)
    } catch {
        // Игнорируем ошибки localStorage
    }
}

// Кастомный хук для управления состоянием таблицы
const useTableState = () => {
    const [tableState, setTableState] = useState<TableState>(getInitialTableState)
    
    // Дебаунсированное сохранение в localStorage
    const debouncedSave = useMemo(
        () => debounce((state: TableState) => saveTableState(state), 300),
        []
    )
    
    // Сохраняем состояние при изменении
    useEffect(() => {
        debouncedSave(tableState)
    }, [tableState, debouncedSave])
    
    // Функции для обновления отдельных частей состояния
    const updateColumnVisibility = useCallback((visibility: VisibilityState) => {
        setTableState(prev => ({ ...prev, columnVisibility: visibility }))
    }, [])
    
    const updateColumnSizing = useCallback((sizing: ColumnSizingState) => {
        setTableState(prev => ({ ...prev, columnSizing: sizing }))
    }, [])
    
    const updateColumnOrder = useCallback((order: ColumnOrderState) => {
        setTableState(prev => ({ ...prev, columnOrder: order }))
    }, [])
    
    // Функции для сброса к начальным значениям
    const resetColumnVisibility = useCallback(() => {
        setTableState(prev => ({ ...prev, columnVisibility: {} }))
    }, [])
    
    // const resetColumnSizing = useCallback(() => {
    //     const columnConfig = getTanStackColumnConfig()
    //     const defaultSizing = {}
        
    //     Object.entries(columnConfig).forEach(([key, config]) => {
    //         defaultSizing[config.id] = config.size
    //     })
        
    //     setTableState(prev => ({ ...prev, columnSizing: defaultSizing }))
    // }, [])
    
    const resetColumnOrder = useCallback(() => {
        setTableState(prev => ({ ...prev, columnOrder: [] }))
    }, [])
    
    return {
        tableState,
        updateColumnVisibility,
        updateColumnSizing,
        updateColumnOrder,
        resetColumnVisibility,
        // resetColumnSizing,
        resetColumnOrder,
    }
}

// Общие функции для пагинации
const getTotalPages = (total: number) => Math.ceil(total / DEFAULT_PAGE_SIZE)

// TanStack Table компонент
export const TanStackTable = ({ 
    totalRows, 
    dataSource, 
    columns,
    pageSize = DEFAULT_PAGE_SIZE, 
    // keyPath, 
    // shouldHidePaginationOnSinglePage, 
    loading, 
    onRow,
}) => {
    // const rowKey = keyPath || 'id'
    // const hideOnSinglePage = !!shouldHidePaginationOnSinglePage

    const router = useRouter()
    const { offset, sorters } = useMemo(() => parseQuery(router.query), [router.query])
    const currentPageIndex = useCallback(() => getPageIndexFromOffset(offset, pageSize), [offset, pageSize])
    const totalPages = useCallback(() => getTotalPages(totalRows || 0), [totalRows])
    
    // Управление состоянием таблицы через кастомный хук
    const {
        tableState,
        updateColumnVisibility,
        // updateColumnSizing,
        updateColumnOrder,
        resetColumnVisibility,
        // resetColumnSizing,
        resetColumnOrder,
    } = useTableState()
    
    const { columnVisibility, columnOrder } = tableState
    
    // Кастомный обработчик изменения размера колонок
    // const handleColumnSizingChange = useCallback((updaterOrValue) => {
    //     const newSizing = typeof updaterOrValue === 'function' ? updaterOrValue(columnSizing) : updaterOrValue
    //     updateColumnSizing(newSizing)
    // }, [columnSizing, updateColumnSizing])
    
    const columnHelper = createColumnHelper()
    
    // Создаем колонки из единого источника правды
    const columnsDefinitions = useMemo(() => createTanStackColumns(columnHelper, columns), [columnHelper, columns])
    
    // Состояние сортировки из URL
    const [sorting, setSorting] = useState<SortingState>(() => {
        return sorters.map(sorter => ({
            id: sorter.columnKey,
            desc: sorter.order === 'descend',
        }))
    })

    
    // Обработчик изменения сортировки
    const handleSortingChange = useCallback((updaterOrValue) => {
        const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue
        
        if (newSorting.length > 0) {
            const { id, desc } = newSorting[0]
            const order = desc ? 'descend' : 'ascend'
            const sortValue = `${id}_${FULL_TO_SHORT_ORDERS_MAP[order]}`
            const newParameters = { sort: sortValue }
            updateQuery(router, { newParameters }, { resetOldParameters: false, shallow: true })
        } else {
            // Убираем сортировку
            const newParameters = { sort: undefined }
            updateQuery(router, { newParameters }, { resetOldParameters: false, shallow: true })
        }
    }, [router, sorting])
    
    // Обновляем состояние сортировки при изменении URL
    useEffect(() => {
        setSorting(sorters.map(sorter => ({
            id: sorter.columnKey,
            desc: sorter.order === 'descend',
        })))
    }, [sorters])
    
    // Обработчик изменения страницы
    const handlePageChange = (updater) => {
        const newPagination = typeof updater === 'function' ? updater(table.getState().pagination) : updater
        const newOffset = newPagination.pageIndex * newPagination.pageSize
        const newParameters = { offset: newOffset }
        updateQuery(router, { newParameters }, { resetOldParameters: false, shallow: true })
    }
    
    const table = useReactTable({
        data: dataSource || [],
        columns: columnsDefinitions,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualSorting: true, // Управляем сортировкой вручную
        // columnResizeMode: 'onChange' as ColumnResizeMode,

        // Включаем встроенную пагинацию
        manualPagination: true,  // Ручное управление (серверная пагинация)
        pageCount: totalPages(),  // Общее количество страниц с сервера
        
        // Состояние пагинации
        state: {
            pagination: {
                pageIndex: currentPageIndex() - 1,  // TanStack использует 0-based индексы
                pageSize: DEFAULT_PAGE_SIZE,
            },
            sorting,
            columnVisibility,
            // columnSizing,
            columnOrder,
        },
        
        // Обработчики
        onPaginationChange: handlePageChange,
        
        onSortingChange: handleSortingChange,
        onColumnVisibilityChange: updateColumnVisibility,
        // onColumnSizingChange: handleColumnSizingChange,
        onColumnOrderChange: updateColumnOrder,
    })

    // Обновляем состояние пагинации при изменении URL
    useEffect(() => {
        const currentPage = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
        table.setPageIndex(currentPage - 1) // Конвертируем в 0-based индекс
    }, [offset, table])
    
    if (loading) {
        return <div>Загрузка...</div>
    }
    
    // Компонент управления видимостью колонок
    const ColumnVisibilityControls = () => {
        
        return (
            <div className={styles.columnVisibilityControls}>
                <div className={styles.columnVisibilityInner}>
                    <span className={styles.columnVisibilityLabel}>Видимость колонок:</span>
                    {columns.map((column) => {
                        const isVisible = columnVisibility[column.key] !== false
                        return (
                            <Checkbox
                                key={column.key}
                                checked={isVisible}
                                onChange={(e) => {
                                    const newVisibility = { ...columnVisibility }
                                    newVisibility[column.key] = e.target.checked
                                    updateColumnVisibility(newVisibility)
                                }}
                            >
                                {column.title}
                            </Checkbox>
                        )
                    })}
                    <Button 
                        type='secondary'
                        onClick={resetColumnVisibility}
                    >
                        Сбросить видимость
                    </Button>
                    <Button 
                        type='secondary'
                        onClick={resetColumnOrder}
                    >
                        Сбросить порядок
                    </Button>
                </div>
            </div>
        )
    }

    const PaginationControls = () => {

        return (totalPages() > 1 && (
            <div className={styles.paginationContainer}>
                <div className={styles.paginationInfo}>
                    Показано {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, totalRows || 0)} из {totalRows || 0} записей
                </div>
                
                <div className={styles.paginationControls}>
                    {/* Кнопки навигации */}
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
                    
                    {/* Информация о странице */}
                    <span className={styles.paginationInfoText}>
                        Страница {table.getState().pagination.pageIndex + 1} из {table.getPageCount()}
                    </span>
                    
                    <Button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        type='secondary'
                    >
                        {'>'}
                    </Button>
                    <Button
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        type='secondary'
                    >
                        {'>>'}
                    </Button>
                </div>
            </div>
        ))
    }

    // Обновленные стили для TanStack Table
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>TanStack Table (Proof of Concept)</h3>
            
            {/* Управление видимостью колонок */}
            <ColumnVisibilityControls />
            
            {/* Контейнер таблицы с фиксированной шириной */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header, headerIndex) => (
                                    <th 
                                        key={header.id}
                                        className={`${styles.th} ${!header.column.getCanSort() ? styles.thNonSortable : ''}`}
                                        style={{ 
                                            width: header.getSize(),
                                        }}
                                        onClick={() => {
                                            header.column.getToggleSortingHandler()
                                        }}
                                        draggable={true}
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', header.column.id)
                                            e.dataTransfer.effectAllowed = 'move'
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            e.dataTransfer.dropEffect = 'move'
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            const draggedColumnId = e.dataTransfer.getData('text/plain')
                                            const targetColumnId = header.column.id
                                            
                                            if (draggedColumnId !== targetColumnId) {
                                                const newOrder = [...columnOrder]
                                                const draggedIndex = newOrder.indexOf(draggedColumnId)
                                                const targetIndex = newOrder.indexOf(targetColumnId)
                                                
                                                if (draggedIndex === -1) {
                                                    newOrder.splice(targetIndex, 0, draggedColumnId)
                                                } else {
                                                    newOrder.splice(draggedIndex, 1)
                                                    newOrder.splice(targetIndex, 0, draggedColumnId)
                                                }
                                                
                                                updateColumnOrder(newOrder)
                                            }
                                        }}
                                    >
                                        <div className={styles.thContent}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            {header.column.getCanSort() && (
                                                <span className={styles.sortIcon}>
                                                    {{
                                                        asc: '↑',
                                                        desc: '↓',
                                                    }[header.column.getIsSorted() as string] ?? '↕'}
                                                </span>
                                            )}
                                        </div>
                                        {/* {header.column.getCanResize() && (
                                            <div
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                style={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: 0,
                                                    height: '100%',
                                                    width: '4px',
                                                    background: 'rgba(0, 0, 0, 0.1)',
                                                    cursor: 'col-resize',
                                                    userSelect: 'none',
                                                    touchAction: 'none',
                                                }}
                                            />
                                        )} */}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className={styles.tbody}>
                        {table.getRowModel().rows.map((row, rowIndex) => (
                            <tr 
                                key={row.id} 
                                className={`${styles.tr} ${onRow ? styles.trHoverable : ''}`}
                                onClick={() => {
                                    if (onRow) {
                                        onRow(row.original)
                                    }
                                }}
                            >
                                {row.getVisibleCells().map((cell, cellIndex) => (
                                    <td 
                                        key={cell.id}
                                        className={styles.td}
                                        style={{ 
                                            width: cell.column.getSize(),
                                        }}
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

// Создать колонки TanStack Table из конфигурации
const createTanStackColumns = (columnHelper, columns) => {
    
    return columns.map((column) => {
        return columnHelper.accessor(column.dataIndex, {
            id: column.key,
            header: column.title,
            cell: (info) => {
                console.log('123', info)
                return <div>{column.render(info.getValue(), info.row.original)}</div>
                // return <div>{info.getValue()}</div>
            },
            enableSorting: column.sorter,
            size: column.width,

            enableHiding: column.enableHiding || false,

            // minSize: column.minSize,
            // maxSize: column.maxSize,
            // enableResizing: true,
        })
    })
}
