import { SortOrder } from 'antd/es/table/interface'
import { format, formatDuration, intervalToDuration } from 'date-fns'
import EN from 'date-fns/locale/en-US'
import RU from 'date-fns/locale/ru'
import get from 'lodash/get'
import { ParsedUrlQuery } from 'querystring'

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
export const sorterToQuery = (sorter): Array<string> => {
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
    })
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
    return Number(get(query, 'offset', 0)) / PAGINATION_PAGE_SIZE + 1
}