import { ParsedUrlQuery } from 'querystring'
import get from 'lodash/get'
import { IntlShape } from 'react-intl'

const DEFAULT_WIDTH_PRECISION = 2
const PHONE_FORMAT_REGEXP = /(\d)(\d{3})(\d{3})(\d{2})(\d{2})/

/**
 * Formats a phone, convert it from number string to string with dividers
 * for example: 01234567890 -> 0 (123) 456-78-90
*/
export const formatPhone = (phone?: string): string => {
    if (!phone) {
        return phone
    }

    return phone.replace(PHONE_FORMAT_REGEXP, '$1 ($2) $3-$4-$5')
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

export const preciseFloor = (x: number, precision: number = DEFAULT_WIDTH_PRECISION) => {
    return Math.floor(x * Math.pow(10, precision)) / 100
}

export const getAddressDetails = (record, ShortFlatNumber) => {
    const property = get(record, 'property')
    const unitName = get(record, 'unitName')
    const text = get(property, 'address')
    const unitPrefix = unitName ? `${ShortFlatNumber} ${unitName}` : ''

    return { text, unitPrefix }
}

export type StringLiteral<T> = T extends `${string & T}` ? T : never
export type IntlMessageMetaItem = { id: string, lowerCase?: boolean }
export type MessageSetMeta<T> = Record<StringLiteral<T>, IntlMessageMetaItem>
export type IntlMessages<T> = Record<StringLiteral<T>, string>

export const getIntlMessages = <T>(intl: IntlShape, messageSetMeta: MessageSetMeta<T>): IntlMessages<T> => {
    return Object.keys(messageSetMeta).reduce((result, key) => {
        const meta = messageSetMeta[key]
        const message = intl.formatMessage(meta)

        result[key] = meta?.lowerCase ? message.toLowerCase() : message

        return result
    }, {} as IntlMessages<T> )
}
