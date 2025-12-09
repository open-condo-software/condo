import { Meta, StoryObj } from '@storybook/react-webpack5'
import React, { useRef } from 'react'

import { Select, Table, Input, renderTextWithTooltip } from '@open-condo/ui/src'
import type {
    TableProps,
    TableColumn,
    TableLabels,
    TableState,
    GetTableData,
    DefaultColumn,
    RowSelectionOptions,
    TableRef,
} from '@open-condo/ui/src'

export default {
    parameters: {
        docs: {
            codePanel: true,
        },
    },
    title: 'Components/Table',
    component: Table,
    tags: ['autodocs'],
} as Meta

interface TableData {
    id: string
    firstName: string
    lastName: string
    age: number
    status: false | true
    organization?: {
        id: string
        name: string
    }
}

const data: TableData[] = [
    { id: '1', firstName: 'tanner', lastName: 'linsley', age: 33, status: true, organization: { id: '1', name: 'Organization 1' } },
    { id: '2', firstName: 'derek', lastName: 'perkins', age: 40, status: false },
    { id: '3', firstName: 'joe', lastName: 'quarry', age: 50, status: true },
    { id: '4', firstName: 'sarah', lastName: 'day', age: 28, status: true },
    { id: '5', firstName: 'sandy', lastName: 'shore', age: 35, status: true },
    { id: '6', firstName: 'mike', lastName: 'drop', age: 42, status: false },
    { id: '7', firstName: 'tanner', lastName: 'linsley', age: 33, status: true, organization: { id: '1', name: 'Organization 1' } },
    { id: '8', firstName: 'derek', lastName: 'perkins', age: 40, status: false },
    { id: '9', firstName: 'joe', lastName: 'quarry', age: 50, status: true },
    { id: '10', firstName: 'sarah', lastName: 'day', age: 28, status: true },
    { id: '11', firstName: 'sandy', lastName: 'shore', age: 35, status: true },
    { id: '12', firstName: 'mike', lastName: 'drop', age: 42, status: false },
    { id: '13', firstName: 'tanner', lastName: 'linsley', age: 33, status: true, organization: { id: '1', name: 'Organization 1' } },
]

const columns: TableColumn<TableData>[] = [
    {
        id: 'White column',
        header: '',
        enableColumnSettings: false,
        enableSorting: false,
        enableColumnResize: false,
        render: () => <span></span>,
        initialSize: 50,
        minSize: 20,
    },
    {
        dataKey: 'firstName',
        header: 'First Name',
        id: 'firstName',
        initialOrder: 4,
        initialVisibility: true,
        initialSize: '30%',
        render: renderTextWithTooltip({ ellipsis: true }),
        filterComponent: {
            key: 'textColumnFilter',
            componentProps: {
                inputProps: {
                    placeholder: 'Filter by first name',
                },
            },
        },
    },
    {
        dataKey: 'lastName',
        header: 'Last Name',
        id: 'lastName',
        initialSize: '20%',
        initialVisibility: false,
    },
    {
        dataKey: 'age',
        header: 'Age',
        id: 'age',
        initialOrder: 1,
        enableSorting: true,
        filterComponent: ({ setFilterValue, filterValue, confirm }) => (
            <Input
                onChange={(event) => {
                    const value = event.target.value === '' ? null : Number(event.target.value)
                    setFilterValue(value)
                    confirm()
                }} 
                placeholder='Filter by age'
                value={filterValue?.toString()}
            />
        ),
    },
    {
        dataKey: 'status',
        header: 'Status',
        id: 'status',
        initialVisibility: false,
        render: (status, _) => <span>{status === true ? 'Active' : 'Inactive'}</span>,
        filterComponent: ({ setFilterValue, filterValue }) => (
            <Select 
                options={[
                    { label: 'Active', value: true as any }, 
                    { label: 'Inactive', value: false as any },
                ]} 
                onChange={(value) => {
                    setFilterValue(value)
                }} 
                allowClear
                value={filterValue?.toString()}
            />
        ),
    },
    {
        dataKey: 'organization.name',
        enableSorting: false,
        header: (table) => <span>{table.getColumn('organization.name')?.columnDef?.id}</span>,
        id: 'organization.name',
    },
    {
        dataKey: 'organization.id',
        header: 'Organization ID',
        enableSorting: false,
        id: 'organization.id',
        render: (_, record) => <span>{record.organization?.id ? String(record.organization.id) : '—'}</span>,
    },
]

const getTableData: GetTableData<TableData> = (tableState) => {
    return new Promise<{ rowData: TableData[], rowCount: number }>((resolve) => {
        setTimeout(() => {
            const resultData: TableData[] = []
        
            if (Object.keys(tableState.filterState).length > 0) {
                data.forEach(item => {
                    for (const [key, value] of Object.entries(tableState.filterState)) {
                        if (item[key as keyof TableData] === value) {
                            resultData.push(item)
                        }
                    }
                })
            } else if (typeof tableState.globalFilter === 'string' && tableState.globalFilter.trim() !== '') {
                data.forEach(item => {
                    item.firstName === tableState.globalFilter && resultData.push(item)
                })
            } else {
                data.forEach(item => {
                    resultData.push(item)
                })
            }

            if (tableState.sortState.length > 0) {
                const { id, desc } = tableState.sortState[0]
                resultData.sort((a, b) => {
                    const aValue = a[id as keyof TableData]
                    const bValue = b[id as keyof TableData]

                    if (aValue == null && bValue == null) return 0
                    if (aValue == null) return desc ? 1 : -1
                    if (bValue == null) return desc ? -1 : 1

                    if (typeof aValue === 'number' && typeof bValue === 'number') {
                        return desc ? bValue - aValue : aValue - bValue
                    }

                    const aString = String(aValue)
                    const bString = String(bValue)
                    return desc ? bString.localeCompare(aString) : aString.localeCompare(bString)
                })
            }
            resolve({ rowData: resultData.slice(tableState.startRow, tableState.endRow), rowCount: resultData.length })
        }, 1000)
    })
}

const columnLabels: TableLabels = {
    sortDescLabel: 'Sort',
    sortAscLabel: 'Sort',
    filterLabel: 'Filter',
    filteredLabel: 'Filtered',
    settingsLabel: 'Settings',
    sortedDescLabel: 'Sorted',
    sortedAscLabel: 'Sorted',
    noDataLabel: 'No data',
    defaultSettingsLabel: 'Restore default settings',
}
const tableId = '1'

const Template: StoryObj<TableProps<TableData>>['render'] = (args: TableProps<TableData>) => {
    const { 
        id, 
        dataSource, 
        columns, 
        defaultColumn,
        pageSize,
        onTableStateChange: onTableStateChangeCallback,
        initialTableState,
        storageKey,
        onRowClick, 
        rowSelectionOptions,
        getRowId,
    } = args

    const tableRef = useRef<TableRef>(null)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Input type='text' placeholder='Search' onChange={(e) => {
                tableRef.current?.api.setGlobalFilter(e.target.value)
            }} />
            <Table
                ref={tableRef}
                id={id}
                dataSource={dataSource}
                columns={columns}
                defaultColumn={defaultColumn}
                pageSize={pageSize}
                onTableStateChange={onTableStateChangeCallback}
                initialTableState={initialTableState}
                columnLabels={columnLabels}
                storageKey={storageKey}
                onRowClick={onRowClick}
                rowSelectionOptions={rowSelectionOptions}
                getRowId={getRowId}
            />
        </div>
    )
}

const onTableStateChange = (tableState: TableState) => {
    try {    
        localStorage.setItem('tableState', JSON.stringify(tableState))
    } catch (error) {
        console.error('Error saving table state', error)
    }
}

const initialTableState = () => {
    try {
        const tableState = localStorage.getItem('tableState')
        return tableState ? JSON.parse(tableState) : undefined
    } catch (error) {
        console.error('Error getting table state', error)
    }
}

const defaultColumn: DefaultColumn = {
    enableSorting: true,
    enableColumnSettings: true,
    initialVisibility: true,
    initialSize: '150px',
}

const rowSelectionOptions: RowSelectionOptions = {
    enableRowSelection: true,
    onRowSelectionChange: (rowSelectionState) => {
        return rowSelectionState
    },
}

export const Default: StoryObj<TableProps<TableData>> = {
    render: Template,
    args: {
        id: tableId,
        dataSource: getTableData,
        columns,
        columnLabels, 
        storageKey: 'table-default',
    },
}

export const WithInitialTableState: StoryObj<TableProps<TableData>> = {
    render: Template,
    args: {
        id: tableId,
        dataSource: getTableData,
        columns,
        pageSize: 20,
        columnLabels,
        storageKey: 'table-with-initial-state',
        onTableStateChange: onTableStateChange,
        initialTableState: initialTableState(),
    },
}


export const DefaultColumnState: StoryObj<TableProps<TableData>> = {
    render: Template,
    args: {
        id: tableId,
        dataSource: getTableData,
        columns,
        defaultColumn: defaultColumn,
        pageSize: 10,
        columnLabels,
        storageKey: 'table-with-initial-state',
    },
}

export const RowSelectionState: StoryObj<TableProps<TableData>> = {
    render: Template,
    args: {
        id: tableId,
        dataSource: getTableData,
        columns,
        rowSelectionOptions: rowSelectionOptions,
        getRowId: (row) => row.id,
    },
}