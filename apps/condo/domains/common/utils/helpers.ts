import { ParsedUrlQuery } from 'querystring'
import get from 'lodash/get'

export const formatPhone = (phone?: string): string => {
    if (!phone) {
        return phone
    }

    return phone.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5')
}

export const getFiltersFromQuery = <T>(query: ParsedUrlQuery): T | Record<string, never> => {
    const filters = get(query, 'filters')
    if (!filters || typeof filters !== 'string') {
        return {}
    }
    try {
        const parsed = JSON.parse(filters)
        return parsed
    } catch (e) {
        return {}
    }
}
