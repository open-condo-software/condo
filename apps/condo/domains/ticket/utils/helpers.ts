import { SortOrder } from 'antd/es/table/interface'
import { format, formatDuration, intervalToDuration } from 'date-fns'
import EN from 'date-fns/locale/en-US'
import RU from 'date-fns/locale/ru'
import get from 'lodash/get'
import moment from 'moment'
import { ParsedUrlQuery } from 'querystring'
import { Ticket, TicketStatusWhereInput, TicketWhereInput } from '../../../schema'

const LOCALES = {
    ru: RU,
    en: EN,
}

export const getTicketCreateMessage = (intl, ticket) => {
    if (!ticket) {
        return
    }

    const formattedCreatedDate = format(
        new Date(ticket.createdAt),
        'dd MMMM HH:mm',
        { locale: LOCALES[intl.locale] }
    )

    return `${intl.formatMessage({ id: 'CreatedDate' })} ${formattedCreatedDate}`
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

    const formattedDate = ticketLastUpdateDate
        ? formatDuration(
            intervalToDuration({
                start: new Date(ticketLastUpdateDate),
                end: new Date(),
            }),
            { locale: LOCALES[intl.locale], format: ['months', 'days', 'hours', 'minutes'] }
        )
        : ''

    if (ticketLastUpdateDate && !formattedDate) {
        return intl.formatMessage({ id: 'LessThanMinute' })
    }

    return formattedDate
}

export const getTicketPdfName = (intl, ticket) => {
    return `${intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' })}_${ticket.number}.pdf`
}

export const formatPhone = (phone?: string): string => {
    if (!phone) {
        return phone
    }

    return phone.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5')
}

export const getTicketLabel = (intl, ticket) => {
    if (!ticket) {
        return
    }

    const { createdAt, statusUpdatedAt } = ticket
    const ticketLastUpdateDate = createdAt || statusUpdatedAt
    const formattedDate = format(
        new Date(ticketLastUpdateDate), 'M MMM',
        { locale: LOCALES[intl.locale] }
    )

    return `${get(ticket, ['status', 'name'])} ${intl.formatMessage({ id: 'From' })} ${formattedDate}`
}

export const sortStatusesByType = (statuses) => {
    // status priority map [min -> max]
    const orderedStatusPriority = ['deferred', 'canceled', 'completed', 'processing', 'new_or_reopened' ]

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

export interface IFilters extends Pick<Ticket, 'clientName' | 'createdAt' | 'details' | 'number'> {
    status?: Array<string>
    assignee?: string
    executor?: string
    property?: string
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

    const date = moment(createdAt)

    if (date.isValid()) {
        const min = date.startOf('day').toISOString()
        const max = date.endOf('day').toISOString()

        return [min, max]
    }
}

export const propertyToQuery = (property: string) => {
    if (!property) {
        return
    }

    return {
        AND: [{
            name_contains: property,
        }],
    }
}

export const executorToQuery = (executor: string) => {
    if (!executor) {
        return
    }

    return {
        AND: [{
            name_contains: executor,
        }],
    }
}

export const assigneeToQuery = (assignee: string) => {
    if (!assignee) {
        return
    }


    return {
        AND: [{
            name_contains: assignee,
        }],
    }
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

    const executorQuery = executorToQuery(executor)
    const assigneeQuery = assigneeToQuery(assignee)
    const statusFiltersQuery = statusToQuery(statusIds)
    const createdAtQuery = createdAtToQuery(createdAt)
    const propertyQuery = propertyToQuery(property)

    const filtersCollection = [
        statusFiltersQuery && { status: statusFiltersQuery },
        clientName && { clientName_contains: clientName },
        createdAtQuery && { createdAt_gte: createdAtQuery[0] },
        createdAtQuery && { createdAt_lte: createdAtQuery[1] },
        details && { details_contains: details },
        executor && { executor: executorQuery },
        assignee && { assignee: assigneeQuery },
        number && Number(number) && { number: Number(number) },
        property && { property: propertyQuery },
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
        return
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

export const createSorterMap = (sortStringFromQuery: Array<string>): Record<string, SortOrder> => {
    if (!sortStringFromQuery) {
        return {}
    }

    const sortOrders = {
        'ASC': 'ascend',
        'DESC': 'descend',
    }

    const columns = [
        'number',
        'status',
        'details',
        'property',
        'assignee',
        'executor',
        'createdAt',
        'clientName',
    ]

    return sortStringFromQuery.reduce((acc, column) => {
        const [columnKey, sortOrder] = column.split('_')

        const order = sortOrders[sortOrder]

        if (!order || !columns.includes(columnKey)) {
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

export const PAGINATION_PAGE_SIZE = 10

export const getPaginationFromQuery = (query: ParsedUrlQuery): number => {
    return Math.floor(Number(get(query, 'offset', 0)) / PAGINATION_PAGE_SIZE) + 1
}

export const getFiltersFromQuery = (query: ParsedUrlQuery): IFilters => {
    const filters = get(query, 'filters')

    if (!filters) {
        return {}
    }

    try {
        // @ts-ignore
        return JSON.parse(filters)
    } catch (e) {
        return {}
    }
}
