import { flexRender, HeaderGroup, RowData, Table, CoreHeader } from '@tanstack/react-table'
import debounce from 'lodash/debounce'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { 
    MoreVertical, 
    GripHorizontal, 
    SortAsc, 
    SortDesc, 
    Filter, 
    Close,
} from '@open-condo/icons'
import { Button, Dropdown } from '@open-condo/ui/src'
import { colors } from '@open-condo/ui/src/colors'
import { ColumnSettings } from '@open-condo/ui/src/components/Table/components/ColumnSettings'
import type { 
    TableColumnMenuLabels, 
    TableColumnMeta, 
    ColumnDefWithId,
} from '@open-condo/ui/src/components/Table/types'


type TableHeaderProps<TData extends RowData = RowData> = {
    headerGroup: HeaderGroup<TData>
    columns: ColumnDefWithId<TData>[]
    columnMenuLabels: TableColumnMenuLabels
    table: Table<TData>
    resetSettings: () => void
}

type ResetButtonProps = {
    onClick: () => void
    resetLabel: string
    showResetButton?: boolean
}

type FilterMenuDropdownProps<TData extends RowData = RowData> = {
    header: CoreHeader<TData, unknown>
    columnMenuLabels: TableColumnMenuLabels
}

type SettingsMenuDropdownProps<TData extends RowData = RowData> = {
    columnMenuLabels: TableColumnMenuLabels
    columns: ColumnDefWithId<TData>[]
    table: Table<TData>
    resetSettings: () => void
}

const ResetButton = (
    {
        onClick, 
        resetLabel,
        showResetButton = true,
    }: ResetButtonProps
) => {

    if (!showResetButton) {
        return null
    }

    return (
        <div className='condo-dropdown-menu-item-wrapper-reset-button'>
            <Button
                onClick={onClick}
                type='secondary'
                size='medium'
                minimal
                stateless
            >
                {resetLabel}
            </Button>
        </div>
    )
}

const FilterMenuDropdown = <TData extends RowData = RowData>({ header, columnMenuLabels }: FilterMenuDropdownProps<TData>) => {
    const [open, setOpen] = useState(false)
    const [showResetButton, setShowResetButton] = useState(false)
    // Синхронизируем tempValue с реальным значением фильтра колонки
    const currentFilterValue = header.column.getFilterValue()
    const [tempValue, setTempValue] = useState(currentFilterValue)

    // Синхронизируем tempValue при изменении фильтра колонки извне
    useEffect(() => {
        setTempValue(currentFilterValue)
    }, [currentFilterValue])

    const clearFilters = useCallback(() => {
        if (debouncedConfirmRef.current) {
            debouncedConfirmRef.current.cancel()
        }
        header.column.setFilterValue(undefined)
        setTempValue(undefined)
    }, [header.column])

    const debouncedConfirmRef = useRef<ReturnType<typeof debounce> | null>(null)
    
    // Создаем debounced функцию один раз и используем ref для актуального значения
    const debouncedConfirm = useMemo(() => {
        const debounced = debounce(() => {
            // Получаем актуальное значение из ref, а не из замыкания
            const actualValue = tempValueRef.current
            
            // Сохраняем активный элемент перед применением фильтра
            const activeElement = document.activeElement as HTMLElement
            
            header.column.setFilterValue(actualValue)
            
            // Восстанавливаем фокус после применения фильтра
            requestAnimationFrame(() => {
                if (activeElement && activeElement.isConnected) {
                    activeElement.focus()
                    // Для input нужно установить курсор в конец
                    if (activeElement instanceof HTMLInputElement) {
                        const length = activeElement.value.length
                        activeElement.setSelectionRange(length, length)
                    }
                }
            })
        }, 300)
        
        debouncedConfirmRef.current = debounced
        return debounced
    }, [header.column]) // Убираем tempValue из зависимостей

    // Ref для хранения актуального значения tempValue
    const tempValueRef = useRef(tempValue)
    
    // Обновляем ref при изменении tempValue
    useEffect(() => {
        tempValueRef.current = tempValue
    }, [tempValue])

    const confirm = useCallback((opts?: { closeDropdown?: boolean }) => {
        if (opts?.closeDropdown) {
            setOpen(false)
        }
        debouncedConfirm()
    }, [debouncedConfirm])

    const handleClear = useCallback(() => {
        clearFilters()
        confirm({ closeDropdown: true })
    }, [clearFilters, confirm])

    const FilterComponent = (header.column.columnDef.meta as TableColumnMeta)?.filterComponent

    const dropdownRender = useCallback(() => (
        <div 
            className='condo-dropdown-menu-item-wrapper'
            onClick={(e) => e.stopPropagation()}
        >
            {FilterComponent && <FilterComponent
                filterValue={tempValue}
                setFilterValue={setTempValue}
                confirm={confirm}
                clearFilters={clearFilters}
                setShowResetButton={setShowResetButton}
            />}
            <ResetButton
                onClick={handleClear}
                resetLabel={columnMenuLabels?.resetFilterLabel || 'Reset Filter'}
                showResetButton={showResetButton}
            />
        </div>
    ), [FilterComponent, tempValue, setTempValue, confirm, handleClear, columnMenuLabels, showResetButton, clearFilters])


    return (
        <Dropdown
            align={{
                points: ['cl', 'cr'],
                offset: [8, 0],
            }}
            trigger={['click']}
            open={open}
            onOpenChange={setOpen}
            dropdownRender={dropdownRender}
        >
            {
                header.column.getIsFiltered() === true ? (
                    <div className='condo-dropdown-menu-item-inner'>
                        <div className='condo-dropdown-menu-item-inner-left condo-dropdown-menu-item-inner-left-active'>
                            <Filter size='small' color={colors.green[5]}/>
                            {columnMenuLabels?.filteredLabel}
                        </div>
                        <Close size='small' onClick={clearFilters} color={colors.black}/>
                    </div>
                ) : (
                    <div className='condo-dropdown-menu-item-inner'>
                        <div className='condo-dropdown-menu-item-inner-left'>
                            <Filter size='small' color={colors.gray[7]}/>
                            {columnMenuLabels?.filterLabel}
                        </div>
                    </div>
                )
            }
        </Dropdown>
    )
}

const SettingsMenuDropdown = <TData extends RowData = RowData>({ 
    columnMenuLabels,
    columns,
    table,
    resetSettings,
}: SettingsMenuDropdownProps<TData>) => {
    
    return (
        <Dropdown
            align={{
                points: ['cl', 'cr'],
                offset: [8, 0],
            }}
            trigger={['click']}
            dropdownRender={() => (
                <div 
                    onClick={(e) => e.stopPropagation()}
                    className='condo-dropdown-menu-item-wrapper'
                >
                    <ColumnSettings columns={columns} table={table} />
                    <ResetButton
                        onClick={resetSettings}
                        resetLabel={columnMenuLabels?.defaultSettingsLabel || 'Default Settings'}
                    />
                </div>
            )}
        >
            <div className='condo-dropdown-menu-item-inner'>
                <div className='condo-dropdown-menu-item-inner-left'>
                    <GripHorizontal size='small' color={colors.gray[7]} />
                    {columnMenuLabels.settingsLabel}
                </div>
            </div>
        </Dropdown>
    )
}

export function TableHeader <TData extends RowData = RowData> ({ 
    headerGroup, 
    columns, 
    table, 
    columnMenuLabels,
    resetSettings,
}: TableHeaderProps<TData>) {

    const getColumnMenu = useCallback((header: CoreHeader<TData, unknown>) => {
        const columnMenu = []
        const sortingColumnMenuItems = [
            {
                className: 'condo-dropdown-menu-item-container',
                label: (
                    header.column.getIsSorted() === 'desc' ? (
                        <div className='condo-dropdown-menu-item-inner'>
                            <div className='condo-dropdown-menu-item-inner-left condo-dropdown-menu-item-inner-left-active'>
                                <SortDesc size='small' color={colors.green[5]}/>
                                {columnMenuLabels?.sortedDescLabel}
                            </div>
                            <Close size='small' color={colors.black} onClick={(e) => {
                                e.stopPropagation()
                                header.column.clearSorting()
                            }}/>
                        </div>
                    ) : (
                        <div className='condo-dropdown-menu-item-inner'>
                            <div className='condo-dropdown-menu-item-inner-left'>
                                <SortDesc size='small' color={colors.gray[7]}/>
                                {columnMenuLabels?.sortDescLabel}
                            </div>
                        </div>
                    )
                ),
                key: 'sort-desc',
                onClick: () => header.column.toggleSorting(true, true),
            },
            {
                className: 'condo-dropdown-menu-item-container',
                label: (
                    header.column.getIsSorted() === 'asc' ? (
                        <div className='condo-dropdown-menu-item-inner'>
                            <div className='condo-dropdown-menu-item-inner-left condo-dropdown-menu-item-inner-left-active'>
                                <SortAsc size='small' color={colors.green[5]}/>
                                {columnMenuLabels?.sortedAscLabel}
                            </div>
                            <Close size='small' color={colors.black} onClick={(e) => {
                                e.stopPropagation()
                                header.column.clearSorting()
                            }}/>
                        </div>
                    ) : (
                        <div className='condo-dropdown-menu-item-inner'>
                            <div className='condo-dropdown-menu-item-inner-left'>
                                <SortAsc size='small' color={colors.gray[7]}/>
                                {columnMenuLabels?.sortAscLabel} 
                            </div>
                        </div>
                    )
                ),
                key: 'sort-asc',
                onClick: () => header.column.toggleSorting(false, true),
            },
            { type: 'divider' as const },
        ]

        const filterColumnMenuItems = [
            {
                className: 'condo-dropdown-menu-item-container',
                label: (
                    <FilterMenuDropdown 
                        header={header} 
                        columnMenuLabels={columnMenuLabels}
                    />
                ),
                key: 'filter',
            },
            { type: 'divider' as const },
        ]

        const settingColumnMenuItem = {
            className: 'condo-dropdown-menu-item-container',
            label: (
                <SettingsMenuDropdown 
                    columnMenuLabels={columnMenuLabels} 
                    columns={columns}
                    table={table}
                    resetSettings={resetSettings}
                />
            ),
            key: 'settings',
        }

        if (header.column.getCanSort()) {
            columnMenu.push(...sortingColumnMenuItems)
        }

        if (header.column.getCanFilter()) {
            columnMenu.push(...filterColumnMenuItems)
        }

        if ((header.column.columnDef.meta as TableColumnMeta)?.enableColumnSettings) {
            columnMenu.push(settingColumnMenuItem)
        }

        return columnMenu
    }, [columnMenuLabels, columns, table, resetSettings])

    return (
        <div key={headerGroup.id} className='condo-table-thead'>
            {headerGroup.headers.map((header) => {

                return (
                    <div
                        key={header.id}
                        data-header-id={header.id}
                        className={`condo-table-th ${
                            header.column.getIsSorted() || header.column.getIsFiltered() 
                                ? 'condo-table-th-active' 
                                : ''
                        }`}
                        style={{ 
                            width: header.column.getSize(),
                        }}
                    >
                        <div className='condo-table-th-content'>
                            <div className='condo-table-th-title-content'>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                            {((header.column.columnDef.meta as TableColumnMeta)?.enableColumnOptions) && (<div className='condo-table-th-icons'>
                                {header.column.getIsSorted() === 'asc' && <SortAsc size='small' color={colors.green[5]} /> }
                                {header.column.getIsSorted() === 'desc' && <SortDesc size='small' color={colors.green[5]} />}
                                {header.column.getIsFiltered() && <Filter size='small' color={colors.green[5]} />}
                                <Dropdown
                                    menu={{ 
                                        items: getColumnMenu(header),
                                    }}
                                    trigger={['hover']}
                                >
                                    <div className='condo-table-th-more-icon'>
                                        <MoreVertical size='small' />
                                    </div>
                                </Dropdown>
                            </div>)}
                        </div>
                        {/* 
                            <div
                                className='condo-table-th-resize-handle'
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                onDoubleClick={() => header.column.resetSize()}
                                style={isResizing ? {
                                    '--resize-line-position': (deltaOffset >= 0) ? `-${deltaOffset}px` : `${-deltaOffset}px`,
                                } as React.CSSProperties : undefined}
                            />
                        */}
                    </div>
                )
            })}
        </div>
    )
}
