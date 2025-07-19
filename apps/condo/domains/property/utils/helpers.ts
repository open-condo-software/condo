import { ParsedUrlQuery } from 'querystring'

import { BuildingSection, BuildingUnit, Property, PropertyWhereInput } from '@app/condo/schema'
import { SortOrder } from 'antd/es/table/interface'
import get from 'lodash/get'
import uniqWith from 'lodash/uniqWith'

import { TTextHighlighterProps } from '@condo/domains/common/components/TextHighlighter'
import { getAddressDetails, ObjectWithAddressInfo } from '@condo/domains/common/utils/helpers'


export const PROPERTY_PAGE_SIZE = 10

type SorterColumn = {
    columnKey: string
    order: 'ascend' | 'descend'
}

export const getPageIndexFromQuery = (query: ParsedUrlQuery): number => {
    return Math.floor(Number(get(query, 'offset', 0)) / PROPERTY_PAGE_SIZE) + 1
}

export interface IFilters extends Pick<Property, 'address'> {
    address?: string
    search?: string
}

export const getSortStringFromQuery = (query: ParsedUrlQuery): Array<string> => {
    const sort = get(query, 'sort', [])
    if (Array.isArray(sort)) {
        return sort
    }
    return sort.split(',')
}

export const createSorterMap = (sortStringFromQuery: Array<string>): Record<string, SortOrder> => {
    if (!sortStringFromQuery) {
        return {}
    }
    const sortOrders = {
        'ASC': 'ascend',
        'DESC': 'descend',
    }
    const columns = [
        'address',
    ]
    return sortStringFromQuery.reduce((acc, column) => {
        const [columnKey, sortOrder] = column.split('_')
        const order = sortOrders[sortOrder]
        if (!order || !columns.includes(columnKey)) {
            return acc
        }
        acc[columnKey] = order
        return acc
    }, {})
}

export const sorterToQuery = (sorter?: SorterColumn | Array<SorterColumn>): Array<string> => {
    if (!sorter) {
        return
    }
    if (!Array.isArray(sorter)) {
        sorter = [sorter]
    }
    return sorter.map((sort) => {
        const { columnKey, order } = sort
        const sortKeys = {
            'ascend': 'ASC',
            'descend': 'DESC',
        }
        const sortKey = sortKeys[order]
        if (!sortKey) {
            return
        }
        return `${columnKey}_${sortKeys[order]}`
    }).filter(Boolean)
}

export const searchToQuery = (search?: string): PropertyWhereInput[] => {
    if (!search) {
        return
    }

    return [
        { address_contains_i: search },
    ]
}

export const filtersToQuery = (filters: IFilters): PropertyWhereInput => {
    const address = get(filters, 'address')
    const search = get(filters, 'search')

    const searchQuery = searchToQuery(search)

    const filtersCollection = [
        address && { address_contains_i: address },
        searchQuery && { OR: searchQuery },
    ].filter(Boolean)
    if (filtersCollection.length > 0) {
        return {
            AND: filtersCollection,
        }
    }
}

export const getPropertyAddressParts = (property: ObjectWithAddressInfo, DeletedMessage?: string) => {
    const isDeleted = !!property?.deletedAt
    const { streetPart, regionPart, cityPart, settlementPart, areaPart } = getAddressDetails(property)
    const extraProps: Partial<TTextHighlighterProps> = isDeleted && { type: 'secondary' }
    const text = `${streetPart},`
    const deletedMessage = isDeleted && DeletedMessage ? ` (${DeletedMessage})\n` : '\n'
    const region = regionPart ? regionPart : ''
    const area = areaPart ? `, ${areaPart}` : ''
    const city = cityPart ? `${region ? ',' : ''} ${cityPart}` : ''
    const settlement = settlementPart ? `, ${settlementPart}` : ''
    const postfix = region + area + settlement + city + deletedMessage

    return { postfix, extraProps, text }
}

export const getUniqUnits = (units: BuildingUnit[] = []) => uniqWith(units,
    (firstUnit, secondUnit) => firstUnit?.label === secondUnit?.label &&
        firstUnit?.unitType === secondUnit?.unitType
)

export const getUnitsFromSections = (sections: BuildingSection[] = []) => sections.map(section =>
    section?.floors?.map(floor => floor?.units || []) || []
).flat(2)
