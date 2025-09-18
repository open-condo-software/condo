import { Meta, StoryObj } from '@storybook/react-webpack5'
import React from 'react'

import { Table } from '@open-condo/ui/src'
import type { TableProps } from '@open-condo/ui/src'

export default {
    title: 'Components/Table',
    component: Table,
} as Meta

const defaultData: Record<string, unknown>[] = [
    { id: '1', firstName: 'tanner', lastName: 'linsley', age: 33, status: 'new' },
    { id: '2', firstName: 'derek', lastName: 'perkins', age: 40, status: 'new' },
    { id: '3', firstName: 'joe', lastName: 'quarry', age: 50, status: 'new' },
    { id: '4', firstName: 'sarah', lastName: 'day', age: 28, status: 'new' },
    { id: '5', firstName: 'sandy', lastName: 'shore', age: 35, status: 'new' },
    { id: '6', firstName: 'mike', lastName: 'drop', age: 42, status: 'new' },
]

const columns = [
    {
        key: 'firstName',
        header: 'First Name',
        initialOrder: 2,
        initialSize: 100,
        initialVisibility: true,
        render: (value: string) => <div>{value}</div>,
    },
    {
        key: 'lastName',
        header: 'Last Name',
        render: 'date',
    },
    {
        key: 'age',
        header: 'Age',
        render: 'status',
    },
    {
        key: 'status',
        header: 'Status',
        render: 'new',
    },
]

const Template: StoryObj<TableProps>['render'] = (args) => {
  
    return (
        <Table
            {...args}
            dataSource={args.dataSource}
            storageKey='storybook-table'
        />
    )
}

export const Default: StoryObj<TableProps> = {
    render: Template,
    args: {
        dataSource: defaultData,
        columns,
        loading: false,
    },
}
