import { ParsedUrlQuery } from 'querystring'

import {
    OrganizationEmployee,
    OrganizationEmployeeRoleWhereInput,
    OrganizationEmployeeWhereInput,
    SortOrganizationEmployeesBy,
} from '@app/condo/schema'
import { SortOrder } from 'antd/es/table/interface'
import get from 'lodash/get'

export interface IFilters extends Pick<OrganizationEmployee, 'name' | 'phone' | 'email'> {
    name?: string
    phone?: string
    email?: string
    search?: string
    role?: Array<string>
    position?: string
}

export const roleToQuery = (rolesIds: Array<string>): OrganizationEmployeeRoleWhereInput => {
    if (Array.isArray(rolesIds) && rolesIds.length > 0) {
        return {
            AND: [{
                id_in: rolesIds,
            }],
        }
    }
}

export const roleToSearchQuery = (search: string, translations) => {
    const searchLCase = search.toLowerCase()
    const whereIn = !translations ? [] : Object.keys(translations).filter(
        key => (
            key.includes('employee.role')
            && !key.includes('description')
            && translations[key].toLowerCase().includes(searchLCase)
        )
    )
    return {
        role: { 'OR': [
            { name_in: whereIn },
            { name_contains_i: search },
        ] },
    }
}

export const nameToQuery = (name?: string) => {
    if (!name) {
        return
    }

    return {
        AND: [{
            name_contains_i: name,
        }],
    }
}

export const phoneToQuery = (phone?: string) => {
    if (!phone) {
        return
    }

    return {
        AND: [{
            phone_contains_i: phone,
        }],
    }
}

export const emailToQuery = (email?: string) => {
    if (!email) {
        return
    }

    return {
        AND: [{
            email_contains_i: email,
        }],
    }
}

export const searchToQuery = (search?: string, translations = null): OrganizationEmployeeWhereInput[] => {
    if (!search) {
        return
    }

    const roleQuery = roleToSearchQuery(search, translations)

    return [
        { name_contains_i: search },
        { phone_contains_i: search },
        { email_contains_i: search },
        { position_contains_i: search },
        roleQuery,
    ].filter(Boolean)
}

export const filtersToQuery = (filters: IFilters, translations = null): OrganizationEmployeeWhereInput => {
    const name = get(filters, 'name')
    const phone = get(filters, 'phone')
    const email = get(filters, 'email')
    const roles = get(filters, 'role')
    const position = get(filters, 'position')
    const search = get(filters, 'search')

    const roleQuery = roleToQuery(roles)
    const searchQuery = searchToQuery(search, translations)

    const filtersCollection = [
        name && { name_contains_i: name },
        phone && { phone_contains_i: phone },
        email && { email_contains_i: email },
        roles && { role: roleQuery },
        position && { position_contains_i: position },
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

export const sorterToQuery = (sorter?: SorterColumn | Array<SorterColumn>): Array<SortOrganizationEmployeesBy> => {
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

        return `${columnKey}_${sortKeys[order]}` as SortOrganizationEmployeesBy
    }).filter(Boolean)
}

const SORT_ORDERS = {
    'ASC': 'ascend',
    'DESC': 'descend',
}

const EMPLOYEE_TABLE_COLUMNS = [
    'name',
    'phone',
    'email',
    'role',
    'position',
]

export const queryToSorter = (query: Array<string>) => {
    return query.map((sort) => {
        const [columnKey, sortKey] = sort.split('_')

        try {
            if (EMPLOYEE_TABLE_COLUMNS.includes(columnKey) && SORT_ORDERS[sortKey]) {
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

        if (!order || !EMPLOYEE_TABLE_COLUMNS.includes(columnKey)) {
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

export const EMPLOYEE_PAGE_SIZE = 10

export const getPageIndexFromQuery = (query: ParsedUrlQuery): number => {
    return Math.floor(Number(get(query, 'offset', 0)) / EMPLOYEE_PAGE_SIZE) + 1
}
