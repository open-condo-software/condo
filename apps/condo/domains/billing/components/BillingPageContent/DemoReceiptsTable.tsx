import React, { useCallback, useState } from 'react'
import { IContextProps } from './index'
import { Col, Input, Row, Table, Select, Space } from 'antd'
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
import get from 'lodash/get'
import qs from 'qs'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useIntl } from '@core/next/intl'

const PERIODS_AMOUNT = 3
const generatePeriods = (currentPeriod: string, amount: number, locale: string) => {
    const startDate = new Date(currentPeriod)
    let month = startDate.getMonth() + 1
    let year = startDate.getFullYear()
    const result = []
    for (let i = 0; i < amount; i++) {
        if (month === 0) {
            month = 12
            year--
        }
        const paddedMonth = `${month}`.padStart(2, '0')
        const period = `${year}-${paddedMonth}-01`
        const date = new Date(period)
        const fullMonth = date.toLocaleString(locale, { month: 'long' })
        const periodDescription = `${fullMonth} ${year}`
        result.push({ period: period, title: periodDescription })
        month--
    }
    return result
}

// TODO (SavelevMatthew): Move that to new component later or even delete
export const DemoReceiptsTable: React.FC<IContextProps> = ({ context }) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const DataForTitle = intl.formatMessage({ id: 'DataFor' })

    const router = useRouter()
    const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)

    const contextPeriod = get(context, ['lastReport', 'period'], null)
    const options = contextPeriod ? generatePeriods(contextPeriod, PERIODS_AMOUNT, intl.locale) : []
    const [period, setPeriod] = useState(contextPeriod)

    const {
        fetchMore,
        loading,
        count: total,
        objs: receipts,
    } = BillingReceipt.useObjects({
        sortBy: sortFromQuery.length > 0 ? sortFromQuery : ['createdAt_DESC'] as Array<SortBillingReceiptsBy>,
        where: { ...filtersToQuery(filtersFromQuery), context: { id: context.id }, period },
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

    const changePeriod = (newPeriod: string) => {
        handleSearchChange(null)
        setPeriod(newPeriod)
        router.replace('/billing', undefined)
    }


    return (
        <Row gutter={[0, 40]} align={'middle'}>
            <Col span={24}>
                <Space size={40} style={{ width: '100%', flexWrap: 'wrap' }}>
                    <Input
                        style={{ minWidth: 280 }}
                        placeholder={SearchPlaceholder}
                        onChange={(e) => {handleSearchChange(e.target.value)}}
                        value={search}
                    />
                    {options.length > 0 && (
                        <Select
                            style={{ minWidth: 220 }}
                            defaultValue={options[0].period}
                            onChange={(newValue) => changePeriod(newValue)}
                        >
                            {
                                options.map((option, index) => {
                                    return (
                                        <Select.Option value={option.period} key={index}>
                                            {`${DataForTitle} ${option.title}`}
                                        </Select.Option>
                                    )
                                })
                            }
                        </Select>
                    )}

                </Space>
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
                />
            </Col>
        </Row>
    )
}