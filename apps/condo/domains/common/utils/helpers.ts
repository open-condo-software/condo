import { ParsedUrlQuery } from 'querystring'
import get from 'lodash/get'

import { IRecordWithId } from '../types'
import { FilterValue } from 'antd/es/table/interface'
import { Property } from '@app/condo/schema'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(duration)
dayjs.extend(relativeTime)

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

type ObjectWithAddressInfo = Pick<Property, 'address' | 'addressMeta'>
/**
 * Tries to extract address details from a property (or any object, containing address and addressMeta, like ticket)
 * @param property
 */
export const getAddressDetails = (property: ObjectWithAddressInfo) => {
    const addressMeta = get(property, ['addressMeta', 'data'])

    const streetWithType = get(addressMeta, 'street_with_type')

    const houseType = get(addressMeta, 'house_type')
    const houseName = get(addressMeta, 'house')

    const blockType = get(addressMeta, 'block_type')
    const blockName = get(addressMeta, 'block')

    const regionType = get(addressMeta, 'region_type_full')
    const regionName = get(addressMeta, 'region')
    const regionWithType = get(addressMeta, 'region_with_type')
    const regionNamePosition = regionWithType && regionWithType.split(' ')[0] === regionName ? 0 : 1
    const regionWithFullType = regionNamePosition === 0 ? `${regionName} ${regionType}` : `${regionType} ${regionName}`

    const cityWithType = get(addressMeta, 'city_with_type')
    const cityName = get(addressMeta, 'city')

    const settlementPart = get(addressMeta, 'settlement_with_type')

    const block = blockType ? ` ${blockType} ${blockName}` : ''
    const settlement = streetWithType ? streetWithType : settlementPart
    const streetPart = settlement && `${settlement}, ${houseType} ${houseName}${block}`
    const regionPart = regionName && regionName !== cityName && regionWithFullType
    const cityPart = cityWithType && cityWithType

    const areaWithType = get(addressMeta, 'area_with_type')
    const areaPart = areaWithType && areaWithType !== cityPart && areaWithType

    const regionLine = regionPart ? `\n${regionPart}` : ''
    const areaLine = areaPart ? `${regionLine ? ',' : ''}\n${areaPart}` : ''
    const cityLine = cityPart ? `${regionLine ? ',' : ''}\n${cityPart}` : ''
    const settlementLine = settlementPart ? `,\n${settlementPart}` : ''
    const renderPostfix = regionLine + areaLine + settlementLine + cityLine

    return { streetPart, areaPart, settlementPart, regionPart, cityPart, renderPostfix }
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

type humanizeDaysType = (days: number) => string
/**
 * Formats days into a human readable string
 * @param days
 */
export const humanizeDays: humanizeDaysType = (days) => {
    // NOTE function humanize() returns the correct result only for numbers from 1 to 25.
    // It is necessary to work with numbers from 0 to 45 (and more)
    if (days < 0) throw new Error('days cannot be negative')

    const locale = dayjs.locale()
    if (locale !== 'ru' && locale !== 'en') throw new Error('only "en" or "ru" locales')

    let _days = days
    if (locale === 'ru') {
        _days = days % 100
        if (_days > 19) _days = (days - 20) % 10
        if (_days === 0) _days = 10
    } else if (locale === 'en') {
        if (days === 0) _days = 10
        if (days === 1) return '1 day'
        if (days > 1) _days = 2
    }
    const ending = dayjs.duration(_days, 'days').humanize().replace(_days.toString(), '').trim()
    return `${days} ${ending}`
}
