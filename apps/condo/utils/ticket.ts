import { format, formatDuration, intervalToDuration } from 'date-fns'
import RU from 'date-fns/locale/ru'
import EN from 'date-fns/locale/en-US'
import get from 'lodash/get'

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

export const formatPhone = (phone?:string):string => {
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