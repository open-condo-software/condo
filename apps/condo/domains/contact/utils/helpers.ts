import { ParsedUrlQuery } from 'querystring'

import {
    Contact,
    ContactWhereInput,
    SortContactsBy,
} from '@app/condo/schema'
import { SortOrder } from 'antd/es/table/interface'
import get from 'lodash/get'

export interface IFilters extends Pick<Contact, 'name' | 'phone' | 'email'> {
    search?: string
    address?: string
}

export const searchToQuery = (search?: string): ContactWhereInput[] => {
    if (!search) {
        return
    }
    return [
        { name_contains_i: search },
        { phone_contains_i: search },
        { email_contains_i: search },
        { property: { address_contains_i: search } },
    ]
}

export const filtersToQuery = (filters: IFilters): ContactWhereInput => {
    const name = get(filters, 'name')
    const phone = get(filters, 'phone')
    const email = get(filters, 'email')
    const address = get(filters, 'address')
    const search = get(filters, 'search')

    const searchQuery = searchToQuery(search)

    const filtersCollection = [
        name && { name_contains_i: name },
        phone && { phone_contains_i: phone },
        email && { email_contains_i: email },
        address && { property: { address_contains_i: address } },
        searchQuery && { OR: searchQuery },
    ].filter(Boolean)

    if (filtersCollection.length > 0) {
        return {
            AND: filtersCollection,
        }
    }
}

type SorterColumn = {
    columnKey: string,
    order: 'ascend' | 'descend'
}

export const sorterToQuery = (sorter?: SorterColumn | Array<SorterColumn>): Array<SortContactsBy> => {
    if (!sorter) {
        return []
    }

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
        return `${columnKey}_${sortKeys[order]}` as SortContactsBy
    }).filter(Boolean)
}

const SORT_ORDERS = {
    'ASC': 'ascend',
    'DESC': 'descend',
}

const CONTACT_TABLE_COLUMNS = [
    'name',
    'phone',
    'email',
    'address',
    'property',
]

export const queryToSorter = (query: Array<string>) => {
    return query.map((sort) => {
        const [columnKey, sortKey] = sort.split('_')

        try {
            if (CONTACT_TABLE_COLUMNS.includes(columnKey) && SORT_ORDERS[sortKey]) {
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
    if (!sortStringFromQuery) {
        return {}
    }

    return sortStringFromQuery.reduce((acc, column) => {
        const [columnKey, sortOrder] = column.split('_')

        const order = SORT_ORDERS[sortOrder]

        if (!order || !CONTACT_TABLE_COLUMNS.includes(columnKey)) {
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

export const CONTACT_PAGE_SIZE = 10

export const getPageIndexFromQuery = (query: ParsedUrlQuery): number => {
    return Math.floor(Number(get(query, 'offset', 0)) / CONTACT_PAGE_SIZE) + 1
}
