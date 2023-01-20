import { Table as DefaultTable, TableProps } from 'antd'
import { ColumnsType } from 'antd/es/table/interface'
import { TablePaginationConfig } from 'antd/lib/table/interface'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { useRouter } from 'next/router'
import { GetRowKey } from 'rc-table/lib/interface'
import { TableProps as RcTableProps } from 'rc-table/lib/Table'
import React, { useCallback, useMemo } from 'react'

import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import {
    getPageIndexFromOffset,
    parseQuery,
    FULL_TO_SHORT_ORDERS_MAP,
    FiltersFromQueryType,
} from '@condo/domains/common/utils/tables.utils'

import { useLayoutContext } from '../LayoutContext'

export type TableRecord = any

interface ITableProps extends TableProps<TableRecord> {
    loading?: boolean
    totalRows?: number
    dataSource: TableRecord[]
    pageSize?: number
    keyPath?: Array<string> | string
    columns: Array<Record<string, unknown>> | ColumnsType<TableRecord>
    onRow?: (record: TableRecord, index?: number) => React.HTMLAttributes<HTMLElement>
    applyQuery?: (queryParams) => Promise<boolean>
    shouldHidePaginationOnSinglePage?: boolean
}

type TableScrollConfig = RcTableProps['scroll'] & { scrollToFirstRowOnChange?: boolean }

export const DEFAULT_PAGE_SIZE = 30
const TABLE_STYLE = { width: 'auto' }
export const TABLE_SCROlL_CONFIG: TableScrollConfig = { x: true }

export const Table: React.FC<ITableProps> = ({
    keyPath,
    columns,
    loading,
    dataSource,
    totalRows,
    pageSize,
    onRow,
    applyQuery,
    shouldHidePaginationOnSinglePage,
    ...otherTableProps
}) => {
    const rowsPerPage = pageSize || DEFAULT_PAGE_SIZE
    const rowKey = keyPath || 'id'
    const hideOnSinglePage = !!shouldHidePaginationOnSinglePage

    const LayoutContext = useLayoutContext()
    const { shouldTableScroll } = LayoutContext

    const router = useRouter()
    const { filters, offset, sorters } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, rowsPerPage)

    const tablePaginationConfig: false | TablePaginationConfig = useMemo(() => ({
        showSizeChanger: false,
        total: totalRows,
        current: currentPageIndex,
        pageSize: rowsPerPage,
        position: ['bottomLeft'],
        hideOnSinglePage,
    }), [currentPageIndex, hideOnSinglePage, rowsPerPage, totalRows])

    const getRowKey: string | GetRowKey<TableRecord> = useCallback((record) => get(record, rowKey), [rowKey])

    const tableScrollConfig = useMemo(() => shouldTableScroll ? TABLE_SCROlL_CONFIG : {}, [shouldTableScroll])

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
            const newParameters = getFiltersQueryData(newFilters, newSorters, newOffset)
            return updateQuery(router, { newParameters }, { resetOldParameters: false })
        }
    }, 400)

    return (
        <DefaultTable
            scroll={tableScrollConfig}
            bordered
            tableLayout='fixed'
            style={TABLE_STYLE}
            loading={loading}
            rowKey={getRowKey}
            dataSource={dataSource}
            columns={columns}
            onChange={handleChange}
            onRow={onRow}
            pagination={tablePaginationConfig}
            {...otherTableProps}
        />
    )
}