import { flexRender, HeaderGroup, Table, Header } from '@tanstack/react-table'
import classNames from 'classnames'
import debounce from 'lodash/debounce'
import React, { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { 
    MoreVertical, 
    GripHorizontal, 
    SortAsc, 
    SortDesc, 
    Filter, 
    Close,
} from '@open-condo/icons'
import { Button, Dropdown } from '@open-condo/ui/src'
import { ColumnSettings } from '@open-condo/ui/src/components/Table/components/ColumnSettings'
import { DROPDOWN_TRIGGER_CLICK, DROPDOWN_TRIGGER_HOVER } from '@open-condo/ui/src/components/Table/constants'
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
    header: Header<TData, unknown>
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
                        activeElement.selectionEnd !== null && activeElement.setSelectionRange(length, length)
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

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        clearFilters()
        confirm({ closeDropdown: true })
    }, [clearFilters, confirm])

    const FilterComponent = header.column.columnDef.meta?.filterComponent

    const dropdownRender = useCallback(() => (
        <div className='condo-dropdown-menu-item-wrapper'>
            {FilterComponent && <FilterComponent
                filterValue={tempValue}
                setFilterValue={setTempValue}
                confirm={confirm}
                clearFilters={clearFilters}
                setShowResetButton={setShowResetButton}
            />}
            <ResetButton
                onClick={clearFilters}
                resetLabel={columnLabels.resetFilterLabel || 'Reset Filter'}
                showResetButton={showResetButton}
            />
        </div>
    ), [FilterComponent, tempValue, setTempValue, confirm, columnLabels, showResetButton, clearFilters])


    return (
        <Dropdown
            align={{
                points: ['br', 'tl'],
            }}
            trigger={[DROPDOWN_TRIGGER_CLICK]}
            open={open}
            onOpenChange={setOpen}
            dropdownRender={dropdownRender}
        >
            <div className='condo-dropdown-menu-item-inner'>
                <div className={classNames(
                    'condo-dropdown-menu-item-inner-left',
                    header.column.getIsFiltered() && 'condo-dropdown-menu-item-inner-left-active'
                )}>
                    <Filter size='small' className={classNames(
                        'condo-table-icon', 
                        header.column.getIsFiltered() ? 'condo-table-icon-green' : 'condo-table-icon-gray'
                    )} />
                    {header.column.getIsFiltered() 
                        ? 
                        (columnLabels?.filteredLabel || 'Filtered') 
                        : 
                        (columnLabels?.filterLabel || 'Filter')
                    }
                </div>
                {header.column.getIsFiltered() && <Close size='small' onClick={handleClear} className='condo-table-icon condo-table-icon-black'/>}
            </div>
        </Dropdown>
    )
}


function SettingsMenuDropdown <TData> ({ 
    columnLabels,
    columns,
    table,
    resetSettings,
}: SettingsMenuDropdownProps<TData>) {

    const handleResetSettings = useCallback(() => {
        // NOTE: If we reset settings to default, we need to reset filter and sorting state of all hidden columns
        const columnsToReset = new Set<string>()
        table.getAllColumns().forEach(columnItem => {
            if (!columnItem.columnDef.meta?.initialVisibility) {
                columnsToReset.add(columnItem.id)
            }
        })
        table.setColumnFilters((prev) => [...prev].filter(filter => !columnsToReset.has(filter.id)))
        table.setSorting((prev) => [...prev].filter(sorting => !columnsToReset.has(sorting.id)))

        resetSettings()
    }, [table, resetSettings])

    const dropdownSettingRender = useCallback(() => (
        <div className='condo-dropdown-menu-item-wrapper'>
            <ColumnSettings columns={columns} table={table} />
            <ResetButton
                onClick={handleResetSettings}
                resetLabel={columnLabels?.defaultSettingsLabel || 'Restore default settings'}
            />
        </div>
    ), [columns, table, handleResetSettings, columnLabels])
    
    return (
        <Dropdown
            align={{
                points: ['cl', 'cr'],
                offset: [8, 0],
            }}
            trigger={[DROPDOWN_TRIGGER_CLICK]}
            dropdownRender={dropdownSettingRender}
        >
            <div className='condo-dropdown-menu-item-inner'>
                <div className='condo-dropdown-menu-item-inner-left'>
                    <GripHorizontal size='small' className='condo-table-icon condo-table-icon-gray' />
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

    const getColumnMenu = useCallback((header: Header<TData, unknown>) => {
        const columnMenu = []
        const clearSorting: MouseEventHandler<HTMLSpanElement> = (event) => {
            event.stopPropagation()
            header.column.clearSorting()
        }
        const sortingColumnMenuItems = [
            {
                className: 'condo-dropdown-menu-item-container',
                label: (
                    header.column.getIsSorted() === 'desc' ? (
                        <div className='condo-dropdown-menu-item-inner'>
                            <div className='condo-dropdown-menu-item-inner-left condo-dropdown-menu-item-inner-left-active'>
                                <SortDesc size='small' className='condo-table-icon condo-table-icon-green'/>
                                {columnLabels?.sortedDescLabel || 'Sorted'}
                            </div>
                            <Close size='small' className='condo-table-icon condo-table-icon-black' onClick={clearSorting}/>
                        </div>
                    ) : (
                        <div className='condo-dropdown-menu-item-inner'>
                            <div className='condo-dropdown-menu-item-inner-left'>
                                <SortDesc size='small' className='condo-table-icon condo-table-icon-gray'/>
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
                                <SortAsc size='small' className='condo-table-icon condo-table-icon-green'/>
                                {columnLabels?.sortedAscLabel || 'Sort'}
                            </div>
                            <Close size='small' className='condo-table-icon condo-table-icon-black' onClick={clearSorting}/>
                        </div>
                    ) : (
                        <div className='condo-dropdown-menu-item-inner'>
                            <div className='condo-dropdown-menu-item-inner-left'>
                                <SortAsc size='small' className='condo-table-icon condo-table-icon-gray'/>
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
                        className={classNames(
                            'condo-table-th', 
                            (header.column.getIsSorted() || header.column.getIsFiltered()) && 'condo-table-th-active', 
                            header.column.getIsResizing() && 'condo-table-th-resizing'
                        )}
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
                                    {header.column.getIsSorted() === 'asc' && <SortAsc size='small' className='condo-table-icon condo-table-icon-green' /> }
                                    {header.column.getIsSorted() === 'desc' && <SortDesc size='small' className='condo-table-icon condo-table-icon-green' />}
                                    {header.column.getIsFiltered() && <Filter size='small' className='condo-table-icon condo-table-icon-green' />}
                                    <Dropdown
                                        menu={{ 
                                            items: getColumnMenu(header),
                                        }}
                                        trigger={[DROPDOWN_TRIGGER_HOVER]}
                                    >
                                        <div className='condo-table-th-more-icon'>
                                            <MoreVertical size='small' />
                                        </div>
                                    </Dropdown>
                                </div>
                            )}
                        </div>
                        {/* TODO: Need to block dragging of the strip if the size is minimal  */}
                        {header.column.columnDef.meta?.enableColumnResize && (
                            <button
                                className={classNames('condo-table-th-resize-handle')}
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                onDoubleClick={() => header.column.resetSize()}
                                style={header.column.getIsResizing() ? {
                                    '--resize-line-position': `${-(table.getState().columnSizingInfo.deltaOffset || 0)}px`,
                                } as React.CSSProperties : undefined}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
