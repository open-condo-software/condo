import { Meta, StoryObj } from '@storybook/react-webpack5'
import React from 'react'

import { Select, Table, Input, renderTextWithTooltip } from '@open-condo/ui/src'
import type {
    TableProps,
    TableColumn,
    TableColumnMenuLabels,
    TableState,
    GetTableData,
} from '@open-condo/ui/src'

export default {
    title: 'Components/Table',
    component: Table,
    tags: ['autodocs'],
} as Meta

interface TableData {
    id: string
    firstName: string
    lastName: string
    age: number
    status: 'Inactive' | 'Active'
    organization?: {
        id: string
        name: string
    }
}

const data: TableData[] = [
    { id: '1', firstName: 'tanner', lastName: 'linsley', age: 33, status: 'Active', organization: { id: '1', name: 'Organization 1' } },
    { id: '2', firstName: 'derek', lastName: 'perkins', age: 40, status: 'Inactive' },
    { id: '3', firstName: 'joe', lastName: 'quarry', age: 50, status: 'Active' },
    { id: '4', firstName: 'sarah', lastName: 'day', age: 28, status: 'Active' },
    { id: '5', firstName: 'sandy', lastName: 'shore', age: 35, status: 'Active' },
    { id: '6', firstName: 'mike', lastName: 'drop', age: 42, status: 'Inactive' },
    { id: '7', firstName: 'tanner', lastName: 'linsley', age: 33, status: 'Active', organization: { id: '1', name: 'Organization 1' } },
    { id: '8', firstName: 'derek', lastName: 'perkins', age: 40, status: 'Inactive' },
    { id: '9', firstName: 'joe', lastName: 'quarry', age: 50, status: 'Active' },
    { id: '10', firstName: 'sarah', lastName: 'day', age: 28, status: 'Active' },
    { id: '11', firstName: 'sandy', lastName: 'shore', age: 35, status: 'Active' },
    { id: '12', firstName: 'mike', lastName: 'drop', age: 42, status: 'Inactive' },
    { id: '13', firstName: 'tanner', lastName: 'linsley', age: 33, status: 'Active', organization: { id: '1', name: 'Organization 1' } },
]

const columns: TableColumn<TableData>[] = [
    {
        dataKey: 'firstName',
        header: 'First Name',
        id: 'firstName',
        initialOrder: 4,
        initialVisibility: true,
        render: renderTextWithTooltip(),
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
        filterComponent: ({ setFilterValue, filterValue }) => (
            <Input
                onChange={(event) => {
                    const value = Number(event.target.value)
                    setFilterValue(value)
                    console.log('filterValue', filterValue)
                }} 
                placeholder='Filter by age'
                value={filterValue as string || ''}
            />
        ),
    },
    {
        dataKey: 'status',
        header: 'Status',
        id: 'status',
        initialVisibility: false,
        render: (status, _) => <span>{status === 'Active' ? 'Active' : 'Inactive'}</span>,
        filterComponent: ({ setFilterValue, filterValue }) => (
            <Select 
                options={[
                    { label: 'Active', value: 'Active' }, 
                    { label: 'Inactive', value: 'Inactive' },
                ]} 
                onChange={(value) => {
                    setFilterValue(value)
                }} 
                allowClear
                value={filterValue as string}
            />
        ),
    },
    {
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
            
            resolve(data)
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
        columnMenuLabels, 
        onRowClick, 
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

export const Default: StoryObj<TableProps<TableData>> = {
    render: Template,
    args: {
        dataSource: getTableData,
        columns,
        id: tableId,
        columnMenuLabels, 
        storageKey: 'storybook-table',
        onRowClick: (record: TableData) => console.log('Row clicked:', record),
        totalRows: data.length,
        pageSize: 10,
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
        storageKey: 'storybook-table',
        onTableStateChange: onTableStateChange,
        initialTableState: initialTableState(),
    },
}
