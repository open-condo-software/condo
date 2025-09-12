import { Meta, StoryObj } from '@storybook/react-webpack5'
import React from 'react'

import { Table } from '@open-condo/ui/src'
import type { TableProps } from '@open-condo/ui/src'

export default {
    title: 'Components/Table',
    component: Table,
} as Meta

interface Person {
    id: string
    firstName: string
    lastName: string
    age: number
}

const defaultData: Person[] = [
    { id: '1', firstName: 'tanner', lastName: 'linsley', age: 33 },
    { id: '2', firstName: 'derek', lastName: 'perkins', age: 40 },
    { id: '3', firstName: 'joe', lastName: 'quarry', age: 50 },
    { id: '4', firstName: 'sarah', lastName: 'day', age: 28 },
    { id: '5', firstName: 'sandy', lastName: 'shore', age: 35 },
    { id: '6', firstName: 'mike', lastName: 'drop', age: 42 },
]

const columns = [
    {
        key: 'firstName',
        title: 'First Name',
        sorter: true,
    },
    {
        key: 'lastName',
        title: 'Last Name',
        sorter: true,
    },
    {
        key: 'age',
        title: 'Age',
        sorter: true,
    },
]

const Template: StoryObj<TableProps<Person>>['render'] = (args) => {
    const [sorting, setSorting] = React.useState([])
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 3,
    })

    const onSortingChange = (updater: any) => {
        const newSorting = typeof updater === 'function' ? updater(sorting) : updater
        setSorting(newSorting)
    }

    const onPaginationChange = (updater: any) => {
        const newPagination = typeof updater === 'function' ? updater(pagination) : updater
        setPagination(newPagination)
    }

    const sortedData = React.useMemo(() => {
        const sorted = [...(args.dataSource || [])]
        if (sorting.length > 0) {
            const { id, desc } = sorting[0]
            const key = id as keyof Person
            sorted.sort((a, b) => {
                if (a[key] < b[key]) return desc ? 1 : -1
                if (a[key] > b[key]) return desc ? -1 : 1
                return 0
            })
        }
        return sorted
    }, [args.dataSource, sorting])

    const paginatedData = React.useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize
        const end = start + pagination.pageSize
        return sortedData.slice(start, end)
    }, [sortedData, pagination])

    return (
        <Table
            {...args}
            dataSource={paginatedData}
            totalRows={(args.dataSource || []).length}
            sorting={sorting}
            onSortingChange={onSortingChange}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            storageKey='storybook-table'
        />
    )
}

export const Default: StoryObj<typeof TableProps<Person>> = {
    render: Template,
    args: {
        dataSource: defaultData,
        columns,
        totalRows: defaultData.length,
        loading: false,
    },
}
