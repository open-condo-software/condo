import { Meta, StoryObj } from '@storybook/react-webpack5'
import React from 'react'

import { Select, Table, Input, renderTextWithTooltip } from '@open-condo/ui/src'
import type {
    TableProps,
    TableColumn,
    TableColumnMenuLabels,
    TableState,
    GetTableData,
    DefaultColumn,
    RowSelection,
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
        dataKey: '',
        header: '',
        enableColumnSettings: false,
        enableSorting: false,
        render: () => <span></span>,
    },
    {
        dataKey: 'firstName',
        header: 'First Name',
        id: 'firstName',
        initialOrder: 4,
        initialVisibility: true,
        render: renderTextWithTooltip(),
        filterComponent: ({ setFilterValue, filterValue }) => (
            <Input
                onChange={(event) => {
                    const value = event.target.value
                    setFilterValue(value)
                }} 
                placeholder='Filter by first name'
                value={filterValue?.toString()}
            />
        ),
    },
    {
        dataKey: 'lastName',
        header: 'Last Name',
        id: 'lastName',
        initialVisibility: false,
    },
    {
        dataKey: 'age',
        header: 'Age',
        id: 'age',
        initialOrder: 1,
        enableSorting: true,
        filterComponent: ({ setFilterValue, filterValue }) => {
            // We have trouble with number in filter. Table state is not updated
            return (
                <Input
                    onChange={(event) => {
                        const value = +event.target.value
                        setFilterValue(value)
                    }} 
                    placeholder='Filter by age'
                    value={filterValue?.toString()}
                />
            )
        },
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
        // How we can add sorting for this column? 
        dataKey: (row) => row.organization?.name,
        header: 'Organization Name',
        id: 'organization.name',
        render: (_, record) => <span>{record.organization?.name ? String(record.organization.name) : '—'}</span>,
    },
    {
        dataKey: (row) => row.organization?.id,
        header: 'Organization ID',
        id: 'organization.id',
        render: (_, record) => <span>{record.organization?.id ? String(record.organization.id) : '—'}</span>,
    },
]

const getTableData: GetTableData<TableData> = (tableState) => {
    return new Promise<TableData[]>((resolve) => {
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
            } else {
                data.forEach(item => {
                    resultData.push(item)
                })
            }

            if (tableState.sortState.length > 0) {
                const sortDesc = tableState.sortState[0].desc
                const sortId = tableState.sortState[0].id as keyof TableData

                resultData.sort((a, b) => {
                    if (!sortDesc) {
                        switch (typeof a[sortId]) {
                            case 'number':
                                return a[sortId] - (b[sortId] as number)
                            case 'string':
                                if (a[sortId] === undefined || null) return  1
                                if (b[sortId] === undefined || null) return  -1
                                return a[sortId].localeCompare(b[sortId] as string)
                            default:
                                return 0
                        }
                    }
                    switch (typeof b[sortId]) {
                        case 'number':
                            return b[sortId] - (a[sortId] as number)
                        case 'string':
                            if (a[sortId] === undefined || null) return  1
                            if (b[sortId] === undefined || null) return  -1
                            return (b[sortId]).localeCompare(a[sortId] as string)
                        default:
                            return 0
                    }
                })
            }
            resolve(resultData.slice(tableState.startRow, tableState.endRow))
        }, 1000)
    })
}

const columnMenuLabels: TableColumnMenuLabels = {
    sortDescLabel: 'Sort',
    sortAscLabel: 'Sort',
    filterLabel: 'Filter',
    settingsLabel: 'Settings',
    sortedDescLabel: 'Sorted',
    sortedAscLabel: 'Sorted',
    filteredLabel: 'Filtered',
    settedLabel: 'Setted',
}
const tableId = '1'

const Template: StoryObj<TableProps<TableData>>['render'] = (args: TableProps<TableData>) => {
    const { 
        id, 
        dataSource, 
        columns, 
        defaultColumn,
        totalRows, 
        pageSize,
        onTableStateChange,
        initialTableState,
        storageKey,
        onRowClick, 
        rowSelectionOptions,
    } = args

    return (
        <Table<TableData>
            id={id}
            dataSource={dataSource}
            columns={columns}
            defaultColumn={defaultColumn}
            totalRows={totalRows}
            pageSize={pageSize}
            onTableStateChange={onTableStateChange}
            initialTableState={initialTableState}
            columnMenuLabels={columnMenuLabels}
            storageKey={storageKey}
            onRowClick={onRowClick}
            rowSelectionOptions={rowSelectionOptions}
        />
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

const rowSelection: RowSelection<{ id: string }>  = {
    getRowId: (row) => row.id,
}

// How I can visible function in story? 
export const Default: StoryObj<TableProps<TableData>> = {
    render: Template,
    args: {
        id: tableId,
        dataSource: getTableData,
        columns,
        columnMenuLabels, 
        storageKey: 'table-default',
    },
}

export const WithInitialTableState: StoryObj<TableProps<TableData>> = {
    render: Template,
    args: {
        id: tableId,
        dataSource: getTableData,
        columns,
        totalRows: data.length,
        pageSize: 10,
        columnMenuLabels,
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
        totalRows: data.length,
        pageSize: 10,
        columnMenuLabels,
        storageKey: 'table-with-initial-state',
    },
}

export const RowSelectionState: StoryObj<TableProps<TableData>> = {
    render: Template,
    args: {
        id: tableId,
        dataSource: getTableData,
        columns,
        defaultColumn: defaultColumn,
        rowSelectionOptions: rowSelection,
    },
}