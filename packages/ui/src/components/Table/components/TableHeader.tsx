import { flexRender, HeaderGroup, Table, CoreHeader } from '@tanstack/react-table'
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
    TableLabels, 
    ColumnDefWithId,
} from '@open-condo/ui/src/components/Table/types'


type TableHeaderProps<TData> = Readonly<{
    headerGroup: HeaderGroup<TData>
    columns: ColumnDefWithId<TData>[]
    columnLabels: TableLabels
    table: Table<TData>
    resetSettings: () => void
}>

type ResetButtonProps = Readonly<{
    onClick: () => void
    resetLabel: string
    showResetButton?: boolean
}>

type FilterMenuDropdownProps<TData> = Readonly<{
    header: CoreHeader<TData, unknown>
    columnLabels: TableLabels
}>

type SettingsDropdownContentProps<TData> = Readonly<{
    columns: ColumnDefWithId<TData>[]
    table: Table<TData>
    resetSettings: () => void
    columnLabels: TableLabels
}>

type SettingsMenuDropdownProps<TData> = Readonly<{
    columnLabels: TableLabels
    columns: ColumnDefWithId<TData>[]
    table: Table<TData>
    resetSettings: () => void
}>


function ResetButton ({
    onClick, 
    resetLabel,
    showResetButton = true,
}: ResetButtonProps) {

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

function FilterMenuDropdown <TData> ({ 
    header, 
    columnLabels,
}: FilterMenuDropdownProps<TData>) {
    const [open, setOpen] = useState(false)
    const [showResetButton, setShowResetButton] = useState(false)
    const currentFilterValue = header.column.getFilterValue()
    const [tempValue, setTempValue] = useState(currentFilterValue)

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
    
    const debouncedConfirm = useMemo(() => {
        const debounced = debounce(() => {
            const actualValue = tempValueRef.current
            
            const activeElement = document.activeElement as HTMLElement
            
            header.column.setFilterValue(actualValue)
            
            requestAnimationFrame(() => {
                if (activeElement?.isConnected) {
                    activeElement.focus()
                    if (activeElement instanceof HTMLInputElement) {
                        const length = activeElement.value.length
                        activeElement.setSelectionRange(length, length)
                    }
                }
            })
        }, 300)
        
        debouncedConfirmRef.current = debounced
        return debounced
    }, [header.column])

    const tempValueRef = useRef(tempValue)
    
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

    const FilterComponent = header.column.columnDef.meta?.filterComponent

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
                resetLabel={columnLabels.resetFilterLabel || 'Reset Filter'}
                showResetButton={showResetButton}
            />
        </div>
    ), [FilterComponent, tempValue, setTempValue, confirm, handleClear, columnLabels, showResetButton, clearFilters])


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
                            {columnLabels?.filteredLabel || 'Filtered'}
                        </div>
                        <Close size='small' onClick={clearFilters} color={colors.black}/>
                    </div>
                ) : (
                    <div className='condo-dropdown-menu-item-inner'>
                        <div className='condo-dropdown-menu-item-inner-left'>
                            <Filter size='small' color={colors.gray[7]}/>
                            {columnLabels?.filterLabel || 'Filter'}
                        </div>
                    </div>
                )
            }
        </Dropdown>
    )
}

function SettingsDropdownContent <TData> ({
    columns,
    table,
    resetSettings,
    columnLabels,
}: SettingsDropdownContentProps<TData>) {
    return (
        <div 
            onClick={(e) => e.stopPropagation()}
            className='condo-dropdown-menu-item-wrapper'
        >
            <ColumnSettings columns={columns} table={table} />
            <ResetButton
                onClick={resetSettings}
                resetLabel={columnLabels?.defaultSettingsLabel || 'Restore default settings'}
            />
        </div>
    )
}

function SettingsMenuDropdown <TData> ({ 
    columnLabels,
    columns,
    table,
    resetSettings,
}: SettingsMenuDropdownProps<TData>) {
    
    return (
        <Dropdown
            align={{
                points: ['cl', 'cr'],
                offset: [8, 0],
            }}
            trigger={['click']}
            dropdownRender={() => (
                <SettingsDropdownContent
                    columns={columns}
                    table={table}
                    resetSettings={resetSettings}
                    columnLabels={columnLabels}
                />
            )}
        >
            <div className='condo-dropdown-menu-item-inner'>
                <div className='condo-dropdown-menu-item-inner-left'>
                    <GripHorizontal size='small' color={colors.gray[7]} />
                    {columnLabels.settingsLabel || 'Settings'}
                </div>
            </div>
        </Dropdown>
    )
}

export function TableHeader <TData> ({ 
    headerGroup, 
    columns, 
    table, 
    columnLabels,
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
                                {columnLabels?.sortedDescLabel || 'Sorted'}
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
                                {columnLabels?.sortDescLabel || 'Sorted'}
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
                                {columnLabels?.sortedAscLabel || 'Sort'}
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
                                {columnLabels?.sortAscLabel || 'Sort'} 
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
                    <FilterMenuDropdown<TData> 
                        header={header} 
                        columnLabels={columnLabels}
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
                    columnLabels={columnLabels} 
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

        if (header.column.columnDef.meta?.enableColumnSettings) {
            columnMenu.push(settingColumnMenuItem)
        }

        return columnMenu
    }, [columnLabels, columns, table, resetSettings])

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
                        } ${header.column.getIsResizing() ? 'condo-table-th-resizing' : ''}`}
                        style={{ 
                            width: header.column.getSize(),
                        }}
                    >
                        <div className='condo-table-th-content'>
                            <div className='condo-table-th-title-content'>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                            {header.column.columnDef.meta?.enableColumnMenu && (
                                <div className='condo-table-th-icons'>
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
                                </div>
                            )}
                        </div>
                        <div
                            className='condo-table-th-resize-handle'
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onDoubleClick={() => header.column.resetSize()}
                            style={header.column.getIsResizing() ? {
                                '--resize-line-position': `${-(table.getState().columnSizingInfo.deltaOffset || 0)}px`,
                            } as React.CSSProperties : undefined}
                        />
                       
                    </div>
                )
            })}
        </div>
    )
}
