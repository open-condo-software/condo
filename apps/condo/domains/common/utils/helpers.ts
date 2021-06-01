import { ParsedUrlQuery } from 'querystring'

/**
 * Formats a phone, convert it from number string to string with dividers
 * for example: 01234567890 -> 0 (123) 456-78-90
*/
export const formatPhone = (phone?: string): string => {
    if (!phone) {
        return phone
    }

    return phone.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5')
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
