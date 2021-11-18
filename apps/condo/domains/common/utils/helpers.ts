import { ParsedUrlQuery } from 'querystring'
import get from 'lodash/get'

import { IRecordWithId, RecordWithAddressDetails } from '../types'
import { FilterValue } from 'antd/es/table/interface'
import { Property } from '@app/condo/schema'

const DEFAULT_WIDTH_PRECISION = 2
const PHONE_FORMAT_REGEXP = /(\d)(\d{3})(\d{3})(\d{2})(\d{2})/

/**
 * Formats a phone, convert it from number string to string with dividers
 * for example: 01234567890 -> 0 (123) 456-78-90
*/
export const formatPhone = (phone?: string): string =>
    phone ? phone.replace(PHONE_FORMAT_REGEXP, '$1 ($2) $3-$4-$5') : phone


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

/**
 * Tries to extract address details from a property
 * @param property
 */
export const getAddressDetails = (property: Property) => {
    const addressMeta = get(property, ['addressMeta', 'data'])

    const streetType = get(addressMeta, 'street_type')
    const streetName = get(addressMeta, 'street')

    const houseType = get(addressMeta, 'house_type')
    const houseName = get(addressMeta, 'house')

    const regionType = get(addressMeta, 'region_type_full')
    const regionName = get(addressMeta, 'region')

    const cityType = get(addressMeta, 'city_type')
    const cityName = get(addressMeta, 'city')

    const settlement = streetName ? `${streetType}. ${streetName}` : get(addressMeta, 'settlement_with_type')
    const streetLine = settlement && `${settlement}, ${houseType}. ${houseName}`
    const regionLine = regionName && `${regionName} ${regionType}`
    const cityLine = cityName && `${cityType}. ${cityName}`

    return { streetLine, regionLine, cityLine }
}

/**
 * Tries to get id of string type from any record that might contain such
 * @param record
 */
export const getId = (record: IRecordWithId): string | null => get(record, 'id', null)

/**
 * Generic function for extracting value from filters
 * @param filters
 * @param key
 */
export const getFilteredValue = <T>(filters: T, key: string | Array<string>): FilterValue => get(filters, key, null)
