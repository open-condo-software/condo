import { ParsedUrlQuery } from 'querystring'

import { Property } from '@app/condo/schema'
import { FilterValue } from 'antd/es/table/interface'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isNumber from 'lodash/isNumber'
import isObject from 'lodash/isObject'
import { NextRouter } from 'next/router'
import qs from 'qs'

import { IRecordWithId } from '../types'

const DEFAULT_WIDTH_PRECISION = 2
const PHONE_FORMAT_REGEXP = /(\d)(\d{3})(\d{3})(\d{2})(\d{2})/

/**
 * Formats a phone, convert it from number string to string with dividers
 * for example: 01234567890 -> 0 (123) 456-78-90
*/
export const formatPhone = (phone?: string): string =>
    phone ? phone.replace(PHONE_FORMAT_REGEXP, '$1 ($2) $3-$4-$5') : phone


export const getFiltersFromQuery = <T>(query: ParsedUrlQuery): T | Record<string, unknown> => {
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
    const houseNamePrefix = (houseType) ? `${houseType} ` : ''
    const blockType = get(addressMeta, 'block_type')
    const blockName = get(addressMeta, 'block')
    const houseNameSuffix = blockType ? ` ${blockType} ${blockName}` : ''
    const flatType = get(addressMeta, 'flat_type')
    const flatName = get(addressMeta, 'flat')
    const flatPart = flatType ? `${flatType} ${flatName}` : ''

    const regionType = get(addressMeta, 'region_type_full')
    const regionName = get(addressMeta, 'region')
    const regionWithType = get(addressMeta, 'region_with_type')
    const regionNamePosition = regionWithType && regionWithType.split(' ')[0] === regionName ? 0 : 1
    const regionWithFullType = (regionType) ? (regionNamePosition === 0 ? `${regionName} ${regionType}` : `${regionType} ${regionName}`) : `${regionName}`

    const cityPart = get(addressMeta, 'city_with_type')
    const cityName = get(addressMeta, 'city')

    const settlementPart = get(addressMeta, 'settlement_with_type')

    const settlement = streetWithType ? streetWithType : settlementPart
    const settlementWithComma = settlement ? `${settlement}, ` : ''
    const streetPart = `${settlementWithComma}${houseNamePrefix}${houseName}${houseNameSuffix}`
    const regionPart = regionName && regionName !== cityName && regionWithFullType

    const areaWithType = get(addressMeta, 'area_with_type')
    const areaPart = areaWithType && areaWithType !== cityPart && areaWithType

    const regionLine = regionPart ? `\n${regionPart}` : ''
    const areaLine = areaPart ? `${regionLine ? ',' : ''}\n${areaPart}` : ''
    const cityLine = cityPart ? `${regionLine ? ',' : ''}\n${cityPart}` : ''
    const settlementLine = settlementPart ? `,\n${settlementPart}` : ''
    const renderPostfix = regionLine + areaLine + settlementLine + cityLine

    return { flatPart, streetPart, areaPart, settlementPart, regionPart, cityPart, renderPostfix }
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

interface IUpdateQueryOptions {
    routerAction: 'replace' | 'push'
    resetOldParameters: boolean
}
interface IUpdateQueryData {
    newParameters: Record<string, unknown>
    newRoute: string
}
type UpdateQueryType = (router: NextRouter, data: Partial<IUpdateQueryData>, options?: Partial<IUpdateQueryOptions>) => Promise<void>

export const updateQuery: UpdateQueryType = async (router, data, options) => {
    const newParameters = get(data, 'newParameters', {})
    const newRoute = get(data, 'newRoute')
    const routerAction = get(options, 'routerAction', 'push')
    const resetOldParameters = get(options, 'resetOldParameters', true)

    if (isEmpty(newParameters) && isEmpty(newRoute)) return

    const payload = resetOldParameters || newRoute ? {} : { ...router.query }

    for (const key in newParameters) {
        const item = newParameters[key]
        if (item === 0 || (!isNumber(item) && isEmpty(item))) {
            delete payload[key]
        } else {
            payload[key] = (isArray(item) || isObject(item)) ? JSON.stringify(item) : (item as string)
        }
    }

    const route = newRoute || router.asPath.split('?')[0]
    const query = qs.stringify(payload, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
    const url = route + query

    if (routerAction === 'push') {
        await router.push(url)
    } else {
        await router.replace(url)
    }
}
