import { flexRender, HeaderGroup, RowData, Table, ColumnSizingState, Header } from '@tanstack/react-table'
import React, { useCallback, useMemo } from 'react'

import { 
    MoreVertical, 
    GripHorizontal, 
    SortAsc, 
    SortDesc, 
    Filter, 
    Size,
} from '@open-condo/icons'
import { Space, Dropdown } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'

import { ColumnSettings } from './ColumnSettings'

import { MIN_COLUMN_WIDTH } from '../utils/columnSizing'

import type { TableColumn } from '../types'

interface TableHeaderProps<TData extends RowData = RowData> {
    headerGroup: HeaderGroup<TData>
    columns: TableColumn<TData>[]
    table: Table<TData>
    onColumnSizingChange: (updater: React.SetStateAction<ColumnSizingState>) => void
}

export const TableHeader = <TData extends RowData = RowData>({ headerGroup, columns, table, onColumnSizingChange }: TableHeaderProps<TData>) => {
    const [resizingColumnId, setResizingColumnId] = React.useState<string | null>(null)
    const renderColumnSettings = useCallback(() => (
        <ColumnSettings columns={columns} table={table} />
    ), [columns, table])

    const columnContextMenu = useMemo(() => [
        {
            label: (<span>Сортировать</span>),
            key: '1',
            icon: <SortDesc size='small' color={colors.gray[7]} />,
        },
        {
            label: (<span>Сортировать</span>),
            key: '2',
            icon: <SortAsc size='small' color={colors.gray[7]} />,
        },
        { type: 'divider' as const },
        {
            label: (<span>Фильтровать</span>),
            key: '3',
            icon: <Filter size='small' color={colors.gray[7]} />,
        },
        { type: 'divider' as const },
        {
            label: (<span onClick={() => {
                // Сбрасываем размеры всех колонок до первоначального состояния
                const visibleHeaders = table.getVisibleLeafColumns()
                visibleHeaders.forEach(header => {
                    const elements = document.querySelectorAll(`[data-column-id="${header.id}"]`)
                    elements.forEach(element => {
                        const el = element as HTMLElement
                        el.style.width = ''
                        el.style.minWidth = ''
                    })
                })
                
                // Очищаем сохраненные размеры в состоянии
                onColumnSizingChange({})
            }}>Автоматический размер для всех колонок</span>),
            key: '4',
            icon: <Size size='small' color={colors.gray[7]} />,
        },
        { type: 'divider' as const },
        {
            label: (
                <Dropdown
                    align={{
                        points: ['cl', 'cr'],
                        offset: [8, 0],
                    }}
                    dropdownRender={renderColumnSettings}
                >
                    <Space size={8}>
                        <GripHorizontal size='small' color={colors.gray[7]} />
                        <span>Настроить колонки</span>
                    </Space>
                </Dropdown>
            ),
            key: '5',
        },
    ], [renderColumnSettings, onColumnSizingChange, table])

    const createResizeHandler = (header: Header<TData, unknown>) => (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX

        const visibleHeaders = table.getVisibleLeafColumns()
        const currentIndex = visibleHeaders.findIndex(h => h.id === header.id)
        
        if (currentIndex === -1 || currentIndex === visibleHeaders.length - 1) return

        const currentHeader = visibleHeaders[currentIndex]
        const nextHeader = visibleHeaders[currentIndex + 1]
        
        const getCurrentWidth = (headerId: string) => {
            const element = document.querySelector(`[data-column-id="${headerId}"]`) as HTMLElement
            return element ? element.offsetWidth : 150
        }

        const startCurrentWidth = getCurrentWidth(currentHeader.id)
        const startNextWidth = getCurrentWidth(nextHeader.id)

        setResizingColumnId(header.id)

        // Кэшируем элементы для производительности (как в AG Grid)
        const currentElements = document.querySelectorAll(`[data-column-id="${currentHeader.id}"]`)
        const nextElements = document.querySelectorAll(`[data-column-id="${nextHeader.id}"]`)

        const updateWidths = (deltaX: number) => {
            const newCurrentWidth = Math.max(startCurrentWidth + deltaX, MIN_COLUMN_WIDTH)
            const newNextWidth = Math.max(startNextWidth - deltaX, MIN_COLUMN_WIDTH)
            
            // Используем requestAnimationFrame для плавности (как в AG Grid)
            requestAnimationFrame(() => {
                // Батчим изменения стилей
                const currentWidthStr = `${newCurrentWidth}px`
                const nextWidthStr = `${newNextWidth}px`
                
                currentElements.forEach(element => {
                    const el = element as HTMLElement
                    el.style.width = currentWidthStr
                    el.style.minWidth = currentWidthStr
                })
                
                nextElements.forEach(element => {
                    const el = element as HTMLElement
                    el.style.width = nextWidthStr
                    el.style.minWidth = nextWidthStr
                })
            })
        }

        const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
            const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
            const deltaX = currentX - startX
            updateWidths(deltaX)
        }

        const handleMouseUp = () => {
            setResizingColumnId(null)
            
            const finalSizes: Record<string, number> = {}
            visibleHeaders.forEach(h => {
                const element = document.querySelector(`[data-column-id="${h.id}"]`) as HTMLElement
                finalSizes[h.id] = element ? element.offsetWidth : 150
            })
            
            onColumnSizingChange(finalSizes)
            
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.removeEventListener('touchmove', handleMouseMove)
            document.removeEventListener('touchend', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('touchmove', handleMouseMove)
        document.addEventListener('touchend', handleMouseUp)
    }

    return (
        <div key={headerGroup.id} className='condo-table-thead-row'>
            {headerGroup.headers.map((header, index) => {

                return (
                    <div
                        key={header.id}
                        className='condo-table-th'
                        data-column-id={header.id}
                    >
                        <div className='condo-table-th-content'>
                            <div className='condo-table-th-title-content'>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                            <Dropdown
                                menu={{ 
                                    items: columnContextMenu,
                                }}
                                overlayClassName='condo-table-header-dropdown'
                            >
                                <div className='condo-table-th-more-icon'>
                                    <MoreVertical size='small' />
                                </div>
                            </Dropdown>
                        </div>
                        
                        {index < headerGroup.headers.length - 1 && (
                            <div
                                onMouseDown={createResizeHandler(header)}
                                onTouchStart={createResizeHandler(header)}
                                className={`condo-table-resizer condo-table-resizer-right ${resizingColumnId === header.id ? 'is-resizing' : ''}`}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
