import React from 'react'
import { IContextProps } from './index'
import {
    ColumnInfo,
    QueryMeta,
    getStringContainsFilter,
    getStringOptionFilter,
    getPageIndexFromOffset,
    parseQuery,
} from '@condo/domains/common/utils/tables.utils'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { Table, DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
const { getPeriodMessage, getPreviousPeriods } = require('../../utils/period')
import { BillingReceipt } from '@condo/domains/billing/utils/clientSchema'
import { SortBillingReceiptsBy } from '../../../../schema'

const addressFilter = getStringContainsFilter(['property', 'address'])
const accountFilter = getStringContainsFilter(['account', 'number'])
const toPayFilter = getStringContainsFilter('toPay')
const periodFilter = getStringOptionFilter('period')
const queryMetas: Array<QueryMeta> = [
    { keyword: 'address', filters: [addressFilter] },
    { keyword: 'account', filters: [accountFilter] },
    { keyword: 'toPay', filters: [toPayFilter] },
    { keyword: 'period', filters: [periodFilter] },
    { keyword: 'search', filters: [addressFilter, accountFilter, toPayFilter], combineType: 'OR' },
]

const sortableProperties = ['toPay']

const PERIODS_AMOUNT = 3
const generatePeriods = (currentPeriod: string, amount: number, locale: string) => {
    return getPreviousPeriods(currentPeriod, PERIODS_AMOUNT).map((period) => {
        return { period: period, title: getPeriodMessage(period, locale) }
    })
}

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
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

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

    return (
        <>
            <Table
                loading={loading}
                totalRows={total}
                dataSource={receipts}
                columns={columns}
            />
        </>
    )
}