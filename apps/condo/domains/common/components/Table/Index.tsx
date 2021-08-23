import React from 'react'
import { Table as DefaultTable } from 'antd'
import get from 'lodash/get'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import {
    getPageIndexFromOffset,
    parseQuery,
    QueryMeta,
    FULL_TO_SHORT_ORDERS_MAP,
} from '@condo/domains/common/utils/tables.utils'
import qs from 'qs'

interface ITableProps {
    loading: boolean
    totalRows: number
    dataSource: any[]
    pageSize?: number
    keyPath?: Array<string> | string
    columns: Array<Record<string, unknown>>
}

export const DEFAULT_PAGE_SIZE = 10

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

    const handleChange = debounce((...tableChangeArguments) => {
        const [
            nextPagination,
            nextFilters,
            nextSorters,
        ] = tableChangeArguments
        const { current } = nextPagination
        let shouldResetOffset = false

        const newFilters: { [x: string]: QueryMeta } = { ...filters }
        for (const [key, value] of Object.entries(nextFilters)) {
            const oldFilter = get(filters, key)
            if (!value && oldFilter) {
                delete newFilters[key]
            }
            let typedValue = null
            if (Array.isArray(value)) {
                typedValue = value.filter(Boolean).map(String)
            } else if (typeof value === 'string') {
                typedValue = value
            }
            if (typedValue && (!oldFilter || oldFilter !== value)) {
                shouldResetOffset = true
                newFilters[key] = typedValue
            }
        }

        let newSorters  = null
        if (nextSorters && nextSorters.order) {
            shouldResetOffset = true
            newSorters = `${nextSorters.field}_${FULL_TO_SHORT_ORDERS_MAP[nextSorters.order]}`
        }

        const newOffset = shouldResetOffset ? 0 : (current - 1) * rowsPerPage

        const queryParams = {
            filters: JSON.stringify(newFilters),
            offset: newOffset,
            sort: newSorters,
        }

        const newQuery = qs.stringify({ ...queryParams }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
        return router.push(router.route + newQuery)
    }, 400)

    return (
        <>
            <DefaultTable
                bordered
                tableLayout={'fixed'}
                loading={loading}
                rowKey={(record) => get(record, rowKey)}
                dataSource={dataSource}
                columns={columns}
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