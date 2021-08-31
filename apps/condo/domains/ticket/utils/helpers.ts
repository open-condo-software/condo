import { SortOrder } from 'antd/es/table/interface'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import { LOCALES } from '@condo/domains/common/constants/locale'
import dayjs, { Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import { ParsedUrlQuery } from 'querystring'
import {
    Ticket,
    TicketAnalyticsGroupBy,
    TicketGroupedCounter,
    TicketStatus,
    TicketStatusWhereInput,
    TicketWhereInput,
} from '../../../schema'
import { AnalyticsDataType, TicketSelectTypes, ViewModeTypes } from '../components/TicketChart'
import { TICKET_REPORT_DAY_GROUP_STEPS } from '@condo/domains/ticket/constants/common'


dayjs.extend(duration)
dayjs.extend(relativeTime)

export const getTicketCreateMessage = (intl, ticket) => {
    if (!ticket) {
        return
    }
    const dt = dayjs(ticket.createdAt)
    if (!dt.isValid()) return
    const formattedDate = intl.formatDate(dt.valueOf(), {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
    return `${intl.formatMessage({ id: 'CreatedDate' })} ${formattedDate}`
}

export const getTicketTitleMessage = (intl, ticket) => {
    if (!ticket) {
        return
    }

    return `${intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' })} № ${ticket.number}`
}

export const getTicketFormattedLastStatusUpdate = (intl, ticket) => {
    if (!ticket) {
        return
    }

    const { createdAt, statusUpdatedAt } = ticket
    const ticketLastUpdateDate = statusUpdatedAt || createdAt

    if (ticketLastUpdateDate) {
        let duration = dayjs.duration(dayjs(ticketLastUpdateDate).diff(dayjs()))
        if (Math.abs(duration.asSeconds()) < 60) return intl.formatMessage({ id: 'LessThanMinuteAgo' })
        const locale = get(LOCALES, intl.locale)
        if (locale) duration = duration.locale(locale)
        return duration.humanize(true)
    }
    return ''
}

export const getTicketPdfName = (intl, ticket) => {
    return `${intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' })}_${ticket.number}.pdf`
}

export const getTicketLabel = (intl, ticket) => {
    if (!ticket) {
        return
    }

    const { createdAt, statusUpdatedAt } = ticket
    const ticketLastUpdateDate = statusUpdatedAt || createdAt
    const formattedDate = intl.formatDate(dayjs(ticketLastUpdateDate).valueOf(), {
        day: 'numeric',
        month: 'short',
    })

    return `${get(ticket, ['status', 'name'])} ${intl.formatMessage({ id: 'From' })} ${formattedDate}`
}

export const sortStatusesByType = (statuses: Array<TicketStatus>) => {
    // status priority map [min -> max]
    const orderedStatusPriority = ['closed', 'deferred', 'canceled', 'completed', 'processing', 'new_or_reopened']

    return statuses.sort((leftStatus, rightStatus) => {
        const leftStatusWeight = orderedStatusPriority.indexOf(leftStatus.type)
        const rightStatusWeight = orderedStatusPriority.indexOf(rightStatus.type)

        if (leftStatusWeight < rightStatusWeight) {
            return 1
        } else if (leftStatusWeight > rightStatusWeight) {
            return -1
        }

        return 0
    })
}

export interface IFilters extends Pick<Ticket, 'clientName' | 'createdAt' | 'details' | 'number' | 'isEmergency'> {
    status?: Array<string>
    assignee?: string
    executor?: string
    property?: string
    search?: string
}

export const statusToQuery = (statusIds: Array<string>): TicketStatusWhereInput => {
    if (Array.isArray(statusIds) && statusIds.length > 0) {
        return {
            AND: [{
                id_in: statusIds,
            }],
        }
    }
}

export const createdAtToQuery = (createdAt?: string): Array<string> => {
    if (!createdAt) {
        return
    }

    const date = dayjs(createdAt)

    if (date.isValid()) {
        const min = date.startOf('day').toISOString()
        const max = date.endOf('day').toISOString()

        return [min, max]
    }
}

export const propertyToQuery = (address?: string) => {
    if (!address) {
        return
    }

    return {
        AND: [{
            address_contains_i: address,
        }],
    }
}

export const executorToQuery = (executor?: string) => {
    if (!executor) {
        return
    }

    return {
        AND: [{
            name_contains_i: executor,
        }],
    }
}

export const assigneeToQuery = (assignee?: string) => {
    if (!assignee) {
        return
    }

    return {
        AND: [{
            name_contains_i: assignee,
        }],
    }
}

export const statusToQueryByName = (statusName?: string) => {
    if (!statusName) {
        return
    }

    return {
        AND: [{ name_contains_i: statusName }],
    }
}


export const searchToQuery = (search?: string): TicketWhereInput[] => {
    if (!search) {
        return
    }

    const executorQuery = executorToQuery(search)
    const assigneeQuery = assigneeToQuery(search)
    const propertyQuery = propertyToQuery(search)
    const statusQuery = statusToQueryByName(search)

    return [
        { clientName_contains_i: search },
        { details_contains_i: search },
        { executor: executorQuery },
        { assignee: assigneeQuery },
        Number(search) && { number: Number(search) },
        { property: propertyQuery },
        { status: statusQuery },
    ].filter(Boolean)
}

export const filtersToQuery = (filters: IFilters): TicketWhereInput => {
    const statusIds = get(filters, 'status')
    const clientName = get(filters, 'clientName')
    const createdAt = get(filters, 'createdAt')
    const details = get(filters, 'details')
    const number = get(filters, 'number')
    const property = get(filters, 'property')
    const executor = get(filters, 'executor')
    const assignee = get(filters, 'assignee')
    const search = get(filters, 'search')
    const isEmergency = get(filters, 'isEmergency')

    const executorQuery = executorToQuery(executor)
    const assigneeQuery = assigneeToQuery(assignee)
    const statusFiltersQuery = statusToQuery(statusIds)
    const createdAtQuery = createdAtToQuery(createdAt)
    const propertyQuery = propertyToQuery(property)
    const searchQuery = searchToQuery(search)

    const filtersCollection = [
        statusFiltersQuery && { status: statusFiltersQuery },
        clientName && { clientName_contains_i: clientName },
        createdAtQuery && { createdAt_gte: createdAtQuery[0] },
        createdAtQuery && { createdAt_lte: createdAtQuery[1] },
        details && { details_contains_i: details },
        executor && { executor: executorQuery },
        assignee && { assignee: assigneeQuery },
        number && Number(number) && { number: Number(number) },
        property && { property: propertyQuery },
        isEmergency && { isEmergency: true },
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

export const sorterToQuery = (sorter?: SorterColumn | Array<SorterColumn>): Array<string> => {
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

        return `${columnKey}_${sortKeys[order]}`
    }).filter(Boolean)
}

const SORT_ORDERS = {
    'ASC': 'ascend',
    'DESC': 'descend',
}

const TICKET_TABLE_COLUMNS = [
    'number',
    'status',
    'details',
    'property',
    'assignee',
    'executor',
    'createdAt',
    'clientName',
]

export const queryToSorter = (query: Array<string>) => {
    return query.map((sort) => {
        const [columnKey, sortKey] = sort.split('_')

        try {
            if (TICKET_TABLE_COLUMNS.includes(columnKey) && SORT_ORDERS[sortKey]) {
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

        if (!order || !TICKET_TABLE_COLUMNS.includes(columnKey)) {
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

export const TICKET_PAGE_SIZE = 10
const POSSIBLE_PAGE_SIZE = [10, 20, 50, 100]

export const getPageSizeFromQuery = (query: ParsedUrlQuery): number => {
    const queryValue = Number(get(query, 'pagesize', TICKET_PAGE_SIZE))
    if (POSSIBLE_PAGE_SIZE.indexOf(queryValue) !== -1) {
        return queryValue
    }
    const nearest = POSSIBLE_PAGE_SIZE
        .map(validPageSize => ({ validPageSize, difference: Math.abs(queryValue - validPageSize) }))
        .sort((a, b) => a.difference - b.difference)[0].validPageSize
    return nearest
}

export const getPageIndexFromQuery = (query: ParsedUrlQuery): number => {
    return Math.floor(Number(get(query, 'offset', 0)) / getPageSizeFromQuery(query)) + 1
}

/**
 * Formats raw timestamp string into human readable form, depending of what year it represents:
 * 1. For current year it returns day and month;
 * 2. For some previous year it returns day, month and year.
 * @param intl - i18n object from Next.js, containing `locale` prop
 * @param dateStr - raw timestamp string to format
 * @return {String} human readable representation of provided timestamp
 */
export const formatDate = (intl, dateStr?: string): string => {
    const currentDate = new Date()
    const date = new Date(dateStr)
    const pattern = date.getFullYear() === currentDate.getFullYear()
        ? 'D MMMM H:mm'
        : 'D MMMM YYYY H:mm'
    const locale = get(LOCALES, intl.locale)
    const localizedDate = locale ? dayjs(date).locale(locale) : dayjs(date)
    return localizedDate.format(pattern)
}

export type specificationTypes = 'day' | 'week' | 'month'
export type addressPickerType = { id: string; value: string; }
export type GroupTicketsByTypes = 'status' | 'property' | 'category' | 'user' | 'responsible'

export type ticketAnalyticsPageFilters = {
    range: [Dayjs, Dayjs];
    specification: specificationTypes;
    addressList: addressPickerType[];
}

interface IFilterToQuery {
    (
        { filter, viewMode, ticketType, mainGroup }:
        {
            filter: ticketAnalyticsPageFilters,
            viewMode: ViewModeTypes,
            ticketType: TicketSelectTypes,
            mainGroup: GroupTicketsByTypes
        }
    ): { AND: TicketWhereInput['AND'], groupBy: TicketAnalyticsGroupBy[] }
}

export const filterToQuery: IFilterToQuery = ({ filter, viewMode, ticketType, mainGroup }) => {
    const [dateFrom, dateTo] = filter.range
    let groupBy = []
    switch (mainGroup) {
        case 'status':
            groupBy = viewMode === 'line' ? [mainGroup, filter.specification] : ['property', mainGroup]
            break
        case 'property':
            groupBy = viewMode === 'bar' ? ['status', mainGroup] : [mainGroup, 'status']
            break
        case 'category':
        case 'responsible':
        case 'user':
        default:
            throw new Error('unknown or not implemented filter')
    }

    const AND: TicketWhereInput['AND'] = [
        { createdAt_gte: dateFrom.startOf('day').toISOString() },
        { createdAt_lte: dateTo.endOf('day').toISOString() },
    ]

    if (filter.addressList.length) {
        AND.push({ property: { id_in: filter.addressList.map(({ id }) => id) } })
    }

    if (ticketType !== 'all') {
        AND.push(...[
            { isEmergency: ticketType === 'emergency' },
            { isPaid: ticketType === 'paid' },
        ])
    }

    return { AND, groupBy }
}

interface IGetAggregatedData {
    (data: TicketGroupedCounter[], groupBy: TicketAnalyticsGroupBy[]): AnalyticsDataType
}

export const getAggregatedData: IGetAggregatedData = (data, groupByFilter) => {
    const [axisGroupKey] = groupByFilter
    const labelsGroupKey = TICKET_REPORT_DAY_GROUP_STEPS.includes(groupByFilter[1]) ? 'dayGroup' : groupByFilter[1]
    const groupedResult = groupBy(data, axisGroupKey)
    const result = {}
    Object.entries(groupedResult).forEach(([filter, dataObject]) => {
        result[filter] = Object.fromEntries(
            Object.entries(
                groupBy(dataObject, labelsGroupKey)
            ).map(([labelsGroupTitle, resultObject]) => [labelsGroupTitle, resultObject[0].count])
        )
    })
    return result
}
