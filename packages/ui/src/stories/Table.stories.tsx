import { Meta, StoryObj } from '@storybook/react-webpack5'
import React from 'react'

import { Select, Table, Input, renderTextWithTooltip } from '@open-condo/ui/src'
import type {
    TableProps,
    TableColumn,
    TableColumnMenuLabels,
} from '@open-condo/ui/src'

export default {
    title: 'Components/Table',
    component: Table,
} as Meta

interface TableData {
    id: string
    firstName: string
    lastName: string
    age: number
    status: boolean
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
        meta: {
            filterComponent: ({ setFilterValue, filterValue }) => (
                <Input
                    onChange={(event) => {
                        const value = Number(event.target.value)
                        // @ts-ignore
                        setFilterValue(value)
                        console.log('filterValue', filterValue)
                    }} 
                    placeholder='Filter by age'
                    value={filterValue as string || ''}
                />
            ),
            filterFn: (row, columnId, filterValue) => {
                const cellValue = row.getValue(columnId) as number
                if (filterValue === undefined || filterValue === '') return true
                const filterNum = Number(filterValue)
                if (isNaN(filterNum)) return true
                return cellValue.toString().includes(filterNum.toString())
            },
        },
    },
    {
        dataKey: 'status',
        header: 'Status',
        id: 'status',
        initialVisibility: false,
        render: (status, _) => <span>{status ? 'Active' : 'Inactive'}</span>,
        meta: {
            filterComponent: ({ setFilterValue, filterValue }) => (
                <Select 
                    options={[
                        { label: 'Active', value: true },
                        { label: 'Inactive', value: false },
                    ]} 
                    onChange={(value) => {
                        // @ts-ignore
                        setFilterValue(value)
                    }} 
                    allowClear
                    value={filterValue as string}
                />
            ),
        },
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

const columnMenuLabels: TableColumnMenuLabels = {
    sortLabel: 'Сортировать',
    filterLabel: 'Фильтровать',
    settingsLabel: 'Настроить колонки',
    sortedLabel: 'Отсортированно',
    filteredLabel: 'Отфильтрованно',
    settedLabel: 'Настроены колонки',
}

const tableId = '1'

const Template: StoryObj<TableProps<TableData>>['render'] = (args: TableProps<TableData>) => {
    const { dataSource, columns, id, loading, columnMenuLabels, storageKey, defaultColumn, onRowClick } = args

    return (
        <Table<TableData>
            dataSource={dataSource}
            columns={columns}
            id={id}
            columnMenuLabels={columnMenuLabels}
            storageKey={storageKey}
            defaultColumn={defaultColumn}
            loading={loading}
            syncUrlConfig={{
                hasSyncUrl: true,
            }}
            onRowClick={onRowClick}
        />
    )
}

export const Default: StoryObj<TableProps<TableData>> = {
    render: Template,
    args: {
        dataSource: data,
        columns,
        id: tableId,
        loading: false,
        columnMenuLabels, 
        storageKey: 'storybook-table',
        onRowClick: (record: TableData) => console.log('Row clicked:', record),
    },
}
