import { SortOrder } from 'antd/es/table/interface'
import get from 'lodash/get'
import { ParsedUrlQuery } from 'querystring'
import {
    BillingReceipt,
    SortBillingReceiptsBy,
    BillingReceiptWhereInput,
} from '../../../schema'
import { CONTACT_PAGE_SIZE } from '../../contact/utils/helpers'

// TODO (SavelevMatthew): Remove this after common table component will be done

export interface IFilters extends Pick<BillingReceipt, 'toPay' > {
    search?: string
    address?: string
    account?: string
}

export const searchToQuery = (search: string): BillingReceiptWhereInput[] => {
    if (!search) return

    return [
        { toPay_contains_i: search },
        { property: { address_contains_i: search } },
        { account: { number_contains_i: search } },
    ]
}

export const filtersToQuery = (filters: IFilters): BillingReceiptWhereInput => {
    const toPay = get(filters, 'toPay')
    const address = get(filters, 'address')
    const account = get(filters, 'account')
    const search = get(filters, 'search')

    const searchQuery = searchToQuery(search)

    const filterCollection = [
        toPay && { toPay_contains_i: toPay },
        address && { property: { address_contains_i: address } },
        account && { account: { number_contains_i: account } },
        searchQuery && { OR: searchQuery },
    ].filter(Boolean)

    if (filterCollection.length > 0) {
        return {
            AND: filterCollection,
        }
    }
}

type SorterColumn = {
    columnKey: string,
    order: 'ascend' | 'descend'
}

export const sorterToQuery = (sorter?: SorterColumn | Array<SorterColumn>): Array<SortBillingReceiptsBy> => {
    if (!sorter) return []
    if (!Array.isArray(sorter)) {
        sorter = [sorter]
    }

    return sorter.map((sort) => {
        const { columnKey, order } = sort
        const sortKeys = {
            'ascend': 'ASC',
            'descend': 'DESC',
        }
        const sortKey = sortKeys[order]
        if (!sortKey) {
            return
        }
        return `${columnKey}_${sortKeys[order]}` as SortBillingReceiptsBy
    }).filter(Boolean)
}

const SORT_ORDERS = {
    'ASC': 'ascend',
    'DESC': 'descend',
}

const TABLE_COLUMNS = [
    'address',
    'account',
    'toPay',
]

export const queryToSorter = (query: Array<string>) => {
    return query.map((sort) => {
        const [columnKey, sortKey] = sort.split('_')
        try {
            if (TABLE_COLUMNS.includes(columnKey) && SORT_ORDERS[sortKey]) {
                return {
                    columnKey,
                    order: SORT_ORDERS[sortKey],
                }
            }
        } catch (e) {
            // TODO(Dimitreee): send error to sentry
        }

        return
    }).filter(Boolean)
}

export const createSorterMap = (sortStringFromQuery: Array<string>): Record<string, SortOrder> => {
    if (!sortStringFromQuery) return {}

    return sortStringFromQuery.reduce((acc, column) => {
        const [columnKey, sortOrder] = column.split('_')
        const order = SORT_ORDERS[sortOrder]
        if (!order || !TABLE_COLUMNS.includes(columnKey)) {
            return acc
        }
        acc[columnKey] = order
        return acc
    }, {})
}

export const getSortStringFromQuery = (query: ParsedUrlQuery): Array<string> => {
    const sort = get(query, 'sort', [])

    if (Array.isArray(sort)) {
        return sort
    }

    return sort.split(',')
}

export const BILLING_RECEIPTS_PAGE_SIZE = 10

export const getPageIndexFromQuery = (query: ParsedUrlQuery): number => {
    return Math.floor(Number(get(query, 'offset', 0)) / CONTACT_PAGE_SIZE) + 1
}

