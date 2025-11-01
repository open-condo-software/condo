import { Meta, StoryObj } from '@storybook/react-webpack5'
import React from 'react'

import { Table, renderTextWithTooltip } from '@open-condo/ui/src'
import type { TableProps, TableColumn } from '@open-condo/ui/src'

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
}

const data: TableData[] = [
    { id: '1', firstName: 'tanner', lastName: 'linsley', age: 33, status: true },
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
        initialOrder: 2,
        initialSize: 10,
        initialVisibility: true,
        render: renderTextWithTooltip<TableData[keyof TableData]>(),
    },
    {
        dataKey: 'lastName',
        header: 'Last Name',
        initialVisibility: false,
    },
    {
        dataKey: 'age',
        header: 'Age',
    },
    {
        dataKey: 'status',
        header: 'Status',
        render: (value) => <span>{value ? 'Active' : 'Inactive'}</span>,
    },
]

const tableId = '1'

const Template: StoryObj<TableProps<TableData>>['render'] = (args: TableProps<TableData>) => {
    const { dataSource, columns, id, loading, onRowClick } = args

    return (
        <Table<TableData>
            dataSource={dataSource}
            columns={columns}
            id={id}
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
