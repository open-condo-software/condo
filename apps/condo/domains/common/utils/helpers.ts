import { ParsedUrlQuery } from 'querystring'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { PHONE_CLEAR_REGEXP } from '@condo/domains/common/constants/regexps'
import * as dateFns  from 'date-fns'

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
 * Produces safe phone number string with only digits and '+' sign
 */
export const stripPhone = (phone?: string): string => (
    phone.replace(PHONE_CLEAR_REGEXP, '').replace(' ', '')
)


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
    const format = date.getFullYear() === currentDate.getFullYear()
        ? 'd MMMM k:m'
        : 'd MMMM yyyy k:m'
    return dateFns.format(date, format, { locale: LOCALES[intl.locale] })
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
