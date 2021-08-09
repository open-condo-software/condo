import React, { useCallback, useState } from 'react'
import { IContextProps } from './index'
import { Col, Input, Row, Table } from 'antd'
import { BillingReceipt } from '@condo/domains/billing/utils/clientSchema'
import { useRouter } from 'next/router'
import {
    IFilters,
    filtersToQuery,
    getPageIndexFromQuery,
    getSortStringFromQuery,
    sorterToQuery,
    queryToSorter,
    BILLING_RECEIPTS_PAGE_SIZE,
} from '@condo/domains/billing/utils/helpers'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { SortBillingReceiptsBy } from '../../../../schema'
import { useDemoReceiptTableColumns } from '@condo/domains/billing/hooks/useDemoReceiptTableColumns'
import { debounce, pickBy } from 'lodash'
import qs from 'qs'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useIntl } from '@core/next/intl'

// TODO (SavelevMatthew): Move that to new component later or even delete
export const DemoTable: React.FC<IContextProps> = ({ context }) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })

    const router = useRouter()
    const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)

    // TODO (SavelevMatthew): Filter by context later
    const {
        fetchMore,
        loading,
        count: total,
        objs: receipts,
    } = BillingReceipt.useObjects({
        sortBy: sortFromQuery.length > 0 ? sortFromQuery : ['createdAt_DESC'] as Array<SortBillingReceiptsBy>,
        where: { ...filtersToQuery(filtersFromQuery) },
        skip: (offsetFromQuery * BILLING_RECEIPTS_PAGE_SIZE) - BILLING_RECEIPTS_PAGE_SIZE,
        first: BILLING_RECEIPTS_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const [filtersApplied, setFiltersApplied] = useState(false)
    const tableColumns = useDemoReceiptTableColumns(sortFromQuery, filtersFromQuery, setFiltersApplied)

    const handleTableChange = useCallback(debounce((...tableChangeArguments) => {
        const [nextPagination, nextFilters, nextSorter] = tableChangeArguments
        const { current, pageSize } = nextPagination
        const offset = filtersApplied ? 0 : current * pageSize - pageSize
        const sort = sorterToQuery(nextSorter)
        const filters = filtersToQuery(nextFilters)
        setFiltersApplied(false)

        if (!loading) {
            fetchMore({
                // @ts-ignore
                sortBy: sort,
                where: filters,
                skip: offset,
                first: BILLING_RECEIPTS_PAGE_SIZE,
            }).then(() => {
                const query = qs.stringify(
                    { ...router.query, sort, offset, filters: JSON.stringify(pickBy({ ...filtersFromQuery, ...nextFilters })) },
                    { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
                )

                router.push(router.route + query)
            })
        }
    }, 400), [loading])

    const [search, handleSearchChange] = useSearch<IFilters>(loading)


    return (
        <Row gutter={[0, 40]} align={'middle'}>
            <Col span={6}>
                <Input
                    placeholder={SearchPlaceholder}
                    onChange={(e) => {handleSearchChange(e.target.value)}}
                    value={search}
                />
            </Col>
            <Col span={24}>
                <Table
                    bordered
                    tableLayout={'fixed'}
                    loading={loading}
                    dataSource={receipts}
                    columns={tableColumns}
                    rowKey={(record) => record.id}
                    onChange={handleTableChange}
                    pagination={{
                        showSizeChanger: false,
                        total,
                        current: offsetFromQuery,
                        pageSize: BILLING_RECEIPTS_PAGE_SIZE,
                        position: ['bottomLeft'],
                    }}
                >

                </Table>
            </Col>
        </Row>
    )
}