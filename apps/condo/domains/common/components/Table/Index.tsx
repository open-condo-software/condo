import React from 'react'
import { Table as DefaultTable } from 'antd'
import get from 'lodash/get'
import { getTextFilterDropdown, getFilterIcon, getFilterValue } from './Filters'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { getPageIndexFromOffset, parseQuery, QueryMeta } from '@condo/domains/common/utils/tables.utils'
import qs from 'qs'

interface ITableProps {
    loading: boolean
    totalRows: number
    dataSource: any[]
    pageSize?: number
    keyPath?: Array<string> | string
    columns: Array<ColumnInfo>
}

type StringFilter = {
    type: 'string'
    placeholder?: string
}


export type ColumnInfo = {
    title: string
    key: string
    width: number
    dataIndex: string | Array<string>
    ellipsis?: boolean
    filter?: StringFilter
    visible?: boolean
}

export const DEFAULT_PAGE_SIZE = 10
const DEFAULT_WIDTH_PRECISION = 2

const preciseFloor = (x: number, precision?: number) => {
    precision = precision === undefined ? DEFAULT_WIDTH_PRECISION : precision
    return Math.floor(x * Math.pow(10, precision)) / 100
}

const convertColumns = (
    columns: Array<ColumnInfo>,
    filters: { [x: string]: QueryMeta }
) => {
    const totalWidth = columns
        .filter((column) => get(column, 'visible', true))
        .reduce((acc, current) => acc + current.width, 0)

    return columns.map((column) => {
        const proportionalWidth = column.width * 100 / totalWidth
        const percentageWidth = `${preciseFloor(proportionalWidth)}%`
        const isColumnVisible = get(column, 'visible', true)
        const responsive = isColumnVisible ? undefined : []

        const baseColumnInfo = {
            filteredValue: getFilterValue(column.key, filters),
            title: column.title,
            key: column.key,
            dataIndex: column.dataIndex,
            width: percentageWidth,
            ellipsis: column.ellipsis,
            filterIcon: undefined,
            filterDropdown: undefined,
            responsive,
        }
        if (column.filter) {
            const filter = column.filter
            baseColumnInfo.filterIcon = getFilterIcon
            if (filter.type === 'string') {
                const placeHolder = filter.placeholder || column.title
                baseColumnInfo.filterDropdown = getTextFilterDropdown(placeHolder)
            }
        }
        return baseColumnInfo
    })
}


export const Table: React.FC<ITableProps> = ({
    keyPath,
    columns,
    loading,
    dataSource,
    totalRows,
    pageSize,
}) => {
    const rowsPerPage = pageSize || DEFAULT_PAGE_SIZE
    const rowKey = keyPath || 'id'

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, rowsPerPage)

    const expandedColumns = convertColumns(columns, filters)

    const handleChange = debounce((...tableChangeArguments) => {
        const [
            nextPagination,
            nextFilters,
        ] = tableChangeArguments
        const { current } = nextPagination
        let shouldResetOffset = false

        const newFilters: { [x: string]: QueryMeta } = {}
        for (const [key, value] of Object.entries(nextFilters)) {
            let typedValue = null
            if (Array.isArray(value)) {
                value.filter(Boolean).map(String)
            } else if (typeof value === 'string') {
                typedValue = value
            }
            const oldFilter = get(filters, key)
            if (typedValue && (!oldFilter || oldFilter !== value)) {
                shouldResetOffset = true
                newFilters[key] = typedValue
            }
        }

        const newOffset = shouldResetOffset ? 0 : (current - 1) * rowsPerPage

        const queryParams = {
            filters: JSON.stringify(newFilters),
            offset: newOffset,
        }

        const newQuery = qs.stringify({ ...queryParams }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
        router.push(router.route + newQuery)
    }, 400)

    return (
        <>
            <DefaultTable
                bordered
                tableLayout={'fixed'}
                loading={loading}
                rowKey={(record) => get(record, rowKey)}
                dataSource={dataSource}
                columns={expandedColumns}
                onChange={handleChange}
                pagination={{
                    showSizeChanger: false,
                    total: totalRows,
                    current: currentPageIndex,
                    pageSize: rowsPerPage,
                    position: ['bottomLeft'],
                }}
            />
        </>
    )
}