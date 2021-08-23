import React from 'react'
import { IContextProps } from './index'
import {
    ColumnInfo,
    QueryMeta,
    getStringContainsFilter,
    getPageIndexFromOffset,
    parseQuery,
    convertColumns,
    getSorterMap,
    getFilter,
} from '@condo/domains/common/utils/tables.utils'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { Table, DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { BillingReceipt } from '@condo/domains/billing/utils/clientSchema'
import { SortBillingReceiptsBy } from '../../../../schema'
import get from 'lodash/get'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { usePeriodSelector } from '../../hooks/usePeriodSelector'
import { Row, Col, Space, Input, Select } from 'antd'

const addressFilter = getStringContainsFilter(['property', 'address'])
const accountFilter = getStringContainsFilter(['account', 'number'])
const toPayFilter = getStringContainsFilter('toPay')
const periodFilter = getFilter('period', 'single', 'string')
const queryMetas: Array<QueryMeta> = [
    { keyword: 'address', filters: [addressFilter] },
    { keyword: 'account', filters: [accountFilter] },
    { keyword: 'toPay', filters: [toPayFilter] },
    { keyword: 'period', filters: [periodFilter] },
    { keyword: 'search', filters: [addressFilter, accountFilter, toPayFilter], combineType: 'OR' },
]

const sortableProperties = ['toPay']

export const ReceiptsTable: React.FC<IContextProps> = ({ context }) => {
    const intl = useIntl()
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const ToPayTitle = intl.formatMessage({ id: 'field.TotalPayment' })

    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const DataForTitle = intl.formatMessage({ id: 'DataFor' })

    const router = useRouter()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, sortableProperties)
    const { filters, sorters, offset } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const contextPeriod = get(context, ['lastReport', 'period'], null)
    const [period, options,  handlePeriodChange] = usePeriodSelector(contextPeriod)
    filters['period'] = period

    const {
        loading,
        count: total,
        objs: receipts,
    } = BillingReceipt.useObjects({
        where: { ...filtersToWhere(filters), context: { id: context.id } },
        sortBy: sortersToSortBy(sorters) as SortBillingReceiptsBy[],
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const [search, handleSearchChange] = useSearch(loading)


    const columns: Array<ColumnInfo> = [
        {
            title: AddressTitle,
            key: 'address',
            width: 50,
            dataIndex: ['property', 'address'],
            filter: { type: 'string' },
            ellipsis: true,
        },
        {
            title: AccountTitle,
            key: 'account',
            width: 30,
            dataIndex: ['account', 'number'],
            filter: { type: 'string' },
            ellipsis: true,
        },
        {
            title: ToPayTitle,
            key: 'toPay',
            width: 20,
            dataIndex: 'toPay',
            sortable: true,
            filter: { type: 'string' },
            ellipsis: true,
        },
    ]
    const antdColumns = convertColumns(columns, filters, sorterMap)

    return (
        <Row gutter={[0, 40]}>
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
                            defaultValue={period}
                            onChange={(newValue) => handlePeriodChange(newValue)}
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
                    loading={loading}
                    totalRows={total}
                    dataSource={receipts}
                    columns={antdColumns}
                />
            </Col>
        </Row>
    )
}