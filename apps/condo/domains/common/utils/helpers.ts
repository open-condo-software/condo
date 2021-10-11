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

export type TRecordWithAddressDetails = {
    property: {
        address: string
    },
    unitName?: string
}

/**
 * Tries to extract address details from a record
 * @param record
 * @param ShortFlatNumber
 */
export const getAddressDetails = (record: TRecordWithAddressDetails, ShortFlatNumber?: string) => {
    const property = get(record, 'property')
    const unitName = get(record, 'unitName')
    const text = get(property, 'address')
    const unitPrefix = unitName ? `${ShortFlatNumber} ${unitName}` : ''

    return { text, unitPrefix }
}

/**
 * Converts generic string literal union to a type, so than any member of a union can be used as a generic record key
 * ex.: StringLiteral<'aaa' | 'bbb' | 'ccc'> => ... => record.aaa
 * ex.: type TableMessageKeys = 'NameMessage' | 'PhoneMessage' | 'EmailMessage' | 'AddressMessage' | 'ShortFlatNumber'
 */
export type StringLiteral<T> = T extends `${string & T}` ? T : never
export type IntlMessageMetaItem = { id: string, lowerCase?: boolean }
/**
 * Generic record type for message set meta data. Used to generate intl messages set
 * Here T is a string literal union (see type StringLiteral description above)
 *
 * lowerCase flag forces resulting message text to be automatically converted to lower case
 *
 * ex.:
 *     const TABLE_MESSAGES: MessageSetMeta<TableMessageKeys> = {
 *         NameMessage: { id: 'field.FullName.short', lowerCase: true },
 *         PhoneMessage: { id: 'Phone' },
 *         EmailMessage: { id: 'field.EMail' },
 *         AddressMessage: { id: 'pages.condo.property.field.Address' },
 *         ShortFlatNumber: { id: 'field.FlatNumber' },
 *     }
 */
export type MessageSetMeta<T> = Record<StringLiteral<T>, IntlMessageMetaItem>
/**
 * Generic record type for generated intl messages set
 */
export type IntlMessages<T> = Record<StringLiteral<T>, string>

/**
 * Generic function for generation intl messages from meta
 * @param intl
 * @param messageSetMeta
 */
export const getIntlMessages = <T>(intl: IntlShape, messageSetMeta: MessageSetMeta<T>): IntlMessages<T> => {
    return Object.keys(messageSetMeta).reduce((result, key) => {
        const meta = messageSetMeta[key]
        const message = intl.formatMessage(meta)

        result[key] = meta && meta.lowerCase ? message.toLowerCase() : message

        return result
    }, {} as IntlMessages<T> )
}

/**
 * Describes an object containing a field called id, of string type
 */
export interface IRecordWithId extends Record<string, any> {
    id: string,
}

/**
 * Tries to get id of string type from any record that might contain such
 * @param record
 */
export const getId = (record: IRecordWithId): string | null => record && record.id || null