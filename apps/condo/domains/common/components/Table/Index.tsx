import React from 'react'
import { ColumnsType } from 'antd/es/table/interface'
import { Table as DefaultTable, TableProps } from 'antd'
import get from 'lodash/get'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import {
    getPageIndexFromOffset,
    parseQuery,
    FULL_TO_SHORT_ORDERS_MAP,
    FiltersFromQueryType,
} from '@condo/domains/common/utils/tables.utils'
import qs from 'qs'
import { isEqual } from 'lodash'

export type TableRecord = any

interface ITableProps extends TableProps<TableRecord> {
    loading: boolean
    totalRows: number
    dataSource: TableRecord[]
    pageSize?: number
    keyPath?: Array<string> | string
    columns: Array<Record<string, unknown>> | ColumnsType<TableRecord>
    onRow?: (record: TableRecord, index?: number) => React.HTMLAttributes<HTMLElement>
    applyQuery?: (queryParams) => Promise<boolean>
}

export const DEFAULT_PAGE_SIZE = 30

export const Table: React.FC<ITableProps> = ({
    keyPath,
    columns,
    loading,
    dataSource,
    totalRows,
    pageSize,
    onRow,
    applyQuery,
    ...otherTableProps
}) => {
    const rowsPerPage = pageSize || DEFAULT_PAGE_SIZE
    const rowKey = keyPath || 'id'

    const router = useRouter()
    const { filters, offset, sorters } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, rowsPerPage)

    // Triggered, when table pagination/filters/sorting changes
    // Modifies the query to match the state of the table
    const handleChange = debounce((...tableChangeArguments) => {
        const [
            nextPagination,
            nextFilters,
            nextSorters,
        ] = tableChangeArguments
        const { current } = nextPagination
        let shouldResetOffset = false

        const newFilters: FiltersFromQueryType = { ...filters }
        for (const [tableFilterName, tableFilterValue] of Object.entries(nextFilters)) {
            const oldFilterValue = get(filters, tableFilterName)

            if (!tableFilterValue && oldFilterValue) {
                delete newFilters[tableFilterName]
                shouldResetOffset = true
            }

            let typedValue = null
            if (Array.isArray(tableFilterValue)) {
                typedValue = tableFilterValue.filter(Boolean).map(String)
            } else if (typeof tableFilterValue === 'string') {
                typedValue = tableFilterValue
            }

            if (typedValue && (!oldFilterValue || !isEqual(oldFilterValue, tableFilterValue))) {
                shouldResetOffset = true
                newFilters[tableFilterName] = typedValue
            }
        }

        let newSorters  = null
        if (nextSorters && nextSorters.order) {
            newSorters = `${nextSorters.field}_${FULL_TO_SHORT_ORDERS_MAP[nextSorters.order]}`
        }
        const currentSorters = sorters.map((sorter) => `${sorter.columnKey}_${FULL_TO_SHORT_ORDERS_MAP[sorter.order]}`)
        if ((currentSorters.length && !currentSorters.includes(newSorters)) || (!currentSorters.length && newSorters)) {
            shouldResetOffset = true
        }

        const newOffset = shouldResetOffset ? 0 : (current - 1) * rowsPerPage


        const queryParams = {
            filters: JSON.stringify(newFilters),
            offset: newOffset,
            sort: newSorters,
        }
        if (applyQuery) {
            return applyQuery(queryParams)
        }
        else {
            const newQuery = qs.stringify({ ...queryParams }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
            return router.push(router.route + newQuery)
        }
    }, 400)

    return (
        <>
            <DefaultTable
                bordered
                tableLayout={'fixed'}
                style={{ width: 'auto' }}
                loading={loading}
                rowKey={(record) => get(record, rowKey)}
                dataSource={dataSource}
                columns={columns}
                onChange={handleChange}
                onRow={onRow}
                pagination={{
                    showSizeChanger: false,
                    total: totalRows,
                    current: currentPageIndex,
                    pageSize: rowsPerPage,
                    position: ['bottomLeft'],
                }}
                {...otherTableProps}
            />
        </>
    )
}