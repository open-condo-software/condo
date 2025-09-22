import { Meta, StoryObj } from '@storybook/react-webpack5'
import React from 'react'

import { Table, renderTextWithTooltip } from '@open-condo/ui/src'
import type { TableProps, TableColumn, TableColumnMenuLabels } from '@open-condo/ui/src'

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
        initialOrder: 2,
        initialVisibility: true,
        render: renderTextWithTooltip<TableData[keyof TableData]>(),
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
    },
    {
        dataKey: 'status',
        header: 'Status',
        id: 'status',
        render: (value) => <span>{value ? 'Active' : 'Inactive'}</span>,
    },
    {
        dataKey: (row: TableData) => row.organization?.name,
        header: 'Organization Name',
        id: 'organization.name',
        render: (value) => <span>{value ? value : '—'}</span>,
    },
    {
        dataKey: (row: TableData) => row.organization?.id,
        header: 'Organization ID',
        id: 'organization.id',
        render: (value) => <span>{value ? value : '—'}</span>,
    },
]

const columnMenuLabels: TableColumnMenuLabels = {
    sortLabel: 'Sort',
    filterLabel: 'Filter',
    settingsLabel: 'Settings',
}

const tableId = '1'

const Template: StoryObj<TableProps<TableData>>['render'] = (args: TableProps<TableData>) => {
    const { dataSource, columns, id, loading, onRowClick } = args

    return (
        <Table<TableData>
            dataSource={dataSource}
            columns={columns}
            id={id}
            columnMenuLabels={columnMenuLabels}
            storageKey='storybook-table'
            loading={loading}
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
        onRowClick: (record: TableData) => console.log('Row clicked:', record),
    },
}
