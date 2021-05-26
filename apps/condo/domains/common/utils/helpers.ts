import { ParsedUrlQuery } from 'querystring'
import moment from 'moment'

export const formatPhone = (phone?: string): string => {
    if (!phone) {
        return phone
    }

    return phone.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5')
    /*
        Formats a phone, convert it from number string to string with dividers
        for example: 01234567890 -> 0 (123) 456-78-90
    */
}

/**
 * Formats raw timestamp string into human readable form, depending of what year it represents:
 * 1. For current year it returns day and month;
 * 2. For some previous year it returns day, month and year.
 * @param {String} dateStr - raw timestamp string
 * @return {String} human readable representation of provided timestamp
 */
export const formatDate = (dateStr?: string): string => {
    const date = moment(dateStr)
    const currentDate = new Date()
    return (
        date.year() === currentDate.getFullYear()
            ? date.format('D MMM HH:mm')
            : date.format('D MMM YYYY HH:mm')
    )
}

export const getFiltersFromQuery = <T>(query: ParsedUrlQuery): T | Record<string, never> => {
    const { filters } = query
    if (!filters || typeof filters !== 'string') {
        return {}
    }
    try {
        return JSON.parse(filters)
    } catch (e) {
        return {}
    }
}
