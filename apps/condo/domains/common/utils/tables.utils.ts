import { ParsedUrlQuery } from 'querystring'

import { FilterDropdownProps } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React from 'react'

import { TableRecord } from '@condo/domains/common/components/Table/Index'
import { getTextRender } from '@condo/domains/common/components/Table/Renders'

import { preciseFloor } from './helpers'

import {
    getDateFilterDropdown,
    getFilterIcon,
    getFilterValue,
    getOptionFilterDropdown,
    getTextFilterDropdown,
} from '../components/Table/Filters'

import type { ResolvedIntlConfig } from 'react-intl'


export type DataIndexType = string | Array<string>
export type QueryArgType = string | Array<string>
export type FiltersFromQueryType = { [key: string]: QueryArgType }
type OptionWhereArgumentType = Array<string> | Array<number>
type WhereArgumentType = string | number | boolean | OptionWhereArgumentType
export type WhereType = { [key: string]: WhereArgumentType | Array<WhereArgumentType> | WhereType | Array<WhereType> }
// TODO(mrfoxpro): make type generic
export type FilterType<F = WhereType> = (search: QueryArgType) => F
export type ArgumentType = 'single' | 'array'
export type ArgumentDataType = 'string' | 'number' | 'dateTime' | 'boolean'
export type FiltersApplyMode = 'AND' | 'OR'
type ParsedQueryType = {
    offset: number
    filters: FiltersFromQueryType
    sorters: SorterColumn[]
    tab: string
    type: string
}

type StringFilter = {
    type: 'string'
    placeholder?: string
}

export type OptionType = {
    label: string
    value: string
}

type StringOptionFilter = {
    type: 'stringOption'
    options: Array<OptionType>
    loading?: boolean
}

type DateFilter = {
    type: 'date'
}

type CustomFilter = {
    type: 'custom'
    filterDropdown: (props: FilterDropdownProps) => React.ReactNode
}

export type ColumnInfo<ColumnData> = {
    title: string
    key: string
    width: number
    dataIndex: string | Array<string>
    ellipsis?: boolean
    filter?: StringFilter | StringOptionFilter | DateFilter | CustomFilter
    sortable?: boolean
    visible?: boolean
    grow?: number
    render?: (value: ColumnData, record: TableRecord, index: number) => Record<string, unknown> | React.ReactNode
}

export type QueryMeta<F> = {
    keyword: string
    filters: FilterType<F>[]
    // by default === 'AND'
    combineType?: FiltersApplyMode
    defaultValue?: QueryArgType
    queryToWhereProcessor?: (queryValue: string[]) => QueryArgType
}

export type SorterColumn = {
    columnKey: string
    order: 'ascend' | 'descend'
}
export type Sorters = { [column: string]: 'ascend' | 'descend' }
export type SorterMapType = (sorters: Array<SorterColumn>) => Sorters

export enum FULL_TO_SHORT_ORDERS_MAP {
    ascend = 'ASC',
    descend = 'DESC',
}

enum SHORT_TO_FULL_ORDERS_MAP {
    ASC = 'ascend',
    DESC = 'descend',
}

const INT_32 = 2147483647

export const getFilter: (
    dataIndex: DataIndexType,
    argType: ArgumentType,
    argData: ArgumentDataType,
    suffix?: string
) => FilterType = (
    dataIndex, argType, argData, suffix
) => {
    let wrappedDataIndex = []
    if (Array.isArray(dataIndex) && dataIndex.every(Boolean)) {
        wrappedDataIndex = dataIndex
    } else if (typeof dataIndex === 'string' && dataIndex) {
        wrappedDataIndex = [dataIndex]
    }
    return function getWhereQuery (search) {
        if (!search) return
        if (wrappedDataIndex.length < 1) return
        let args = undefined
        if (argType === 'single' && Array.isArray(search)) return
        if (!Array.isArray(search)) {
            search = [search]
        }
        switch (argData) {
            case 'number':
                // if value is Number, value is not float (indexOf), value is less then signed 32 bit
                args = search.filter(value => Number(value) && String(value).indexOf('.') === -1 && Math.abs(Number(value)) <= INT_32).map(Number)
                break
            case 'dateTime':
                args = search
                    .filter((el) => dayjs(el).isValid())
                    .map((el) => dayjs(el).toISOString())
                break
            case 'string':
                args = search
                    .filter(Boolean)
                    .map(el => el.trim())
                break
            case 'boolean':
                args = search
                    .map((el) => el.toLowerCase())
                    .filter((el) => ['true', 'false'].includes(el))
                    .map((el) => el === 'true')
                break
            default:
                args = search.filter(Boolean)
                break
        }

        if (args.length < 1) return
        if (argType === 'single') {
            args = args[0]
        }
        return wrappedDataIndex.reduceRight<WhereType>((acc, current, index) => {
            if (index === wrappedDataIndex.length - 1) {
                const propertyName = suffix ? `${wrappedDataIndex[index]}_${suffix}` : wrappedDataIndex[index]
                return { [propertyName]: args }
            }
            return { [current]: acc }
        }, undefined)
    }
}

export const getDecimalFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    return getFilter(dataIndex, 'single', 'string', 'in')
}

export const getStringContainsFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    return getFilter(dataIndex, 'single', 'string', 'contains_i')
}

export const getNumberFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    return getFilter(dataIndex, 'single', 'number', null)
}

export const getStringOptionFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    return getFilter(dataIndex, 'array', 'string', 'in')
}

export const getDayGteFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    const filter = getFilter(dataIndex, 'single', 'dateTime', 'gte')
    return function searchDayGte (search) {
        if (!search || Array.isArray(search)) return
        const date = dayjs(search)
        if (!date.isValid()) return
        return filter(date.startOf('day').toISOString())
    }
}

export const getDayLteFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    const filter = getFilter(dataIndex, 'single', 'dateTime', 'lte')
    return function searchDayLte (search) {
        if (!search || Array.isArray(search)) return
        const date = dayjs(search)
        if (!date.isValid()) return
        return filter(date.endOf('day').toISOString())
    }
}

export const getDateTimeGteFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    const filter = getFilter(dataIndex, 'single', 'dateTime', 'gte')
    return function searchDayGte (search) {
        if (!search || Array.isArray(search)) return
        const date = dayjs(search)
        if (!date.isValid()) return
        return filter(date.toISOString())
    }
}

export const getDateTimeLteFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    const filter = getFilter(dataIndex, 'single', 'dateTime', 'lte')
    return function searchDayLte (search) {
        if (!search || Array.isArray(search)) return
        const date = dayjs(search)
        if (!date.isValid()) return
        return filter(date.toISOString())
    }
}

const datesFromTextQuery = (text) => {
    const possibleDates = text.match(/[0-9.]+/g) || []
    const [currentYear, currentMonth] = dayjs().format('YYYY-MM').split('-')
    return possibleDates.map(possibleDate => {
        const [day = '', month = '', year = ''] = possibleDate.split('.')
        if (day.length !== 2) {
            return null
        }
        const date = dayjs([
            day,
            month.length === 2 ? month : currentMonth,
            year.length === 4 ? year : currentYear,
        ].join('.'), 'DD.MM.YYYY')
        if (date.isValid()) {
            return [
                date.startOf('day').toISOString(),
                date.endOf('day').toISOString(),
            ]
        }
        return null
    }).filter(Boolean)
}

export const getDayRangeFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    const gte = getDayGteFilter(dataIndex)
    const lte = getDayLteFilter(dataIndex)
    return function searchRange (search) {
        if (!search) {
            return
        }
        if (typeof search === 'string') {
            [search] = datesFromTextQuery(search)
        }
        if (!Array.isArray(search) || search.length !== 2) return
        const gteWhere = gte(search[0])
        const lteWhere = lte(search[1])
        if (!gteWhere || !lteWhere) return
        return {
            AND: [
                gteWhere,
                lteWhere,
            ],
        }
    }
}

export const getBooleanFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    return getFilter(dataIndex, 'single', 'boolean', undefined)
}

export const getSortersFromQuery = (query: ParsedUrlQuery): SorterColumn[] => {
    let sorters = get(query, 'sort', [])
    if (!Array.isArray(sorters)) {
        sorters = sorters.split(',')
    }

    return sorters
        .map((sorter) => {
            const [column, order] = sorter.split('_')
            if (!column || !order || !SHORT_TO_FULL_ORDERS_MAP[order]) return
            return { columnKey: column, order: SHORT_TO_FULL_ORDERS_MAP[order] }
        })
        .filter(Boolean)
}

export const convertSortersToSortBy = (sorters?: SorterColumn | Array<SorterColumn>): Array<string> => {
    if (!sorters) {
        return []
    }
    if (!Array.isArray(sorters)) {
        sorters = [sorters]
    }
    return sorters
        .map((sorter) => {
            if (!FULL_TO_SHORT_ORDERS_MAP[sorter.order]) return
            return `${sorter.columnKey}_${FULL_TO_SHORT_ORDERS_MAP[sorter.order]}`
        })
        .filter(Boolean)
}

export const getFiltersFromQuery = (query: ParsedUrlQuery): { [x: string]: QueryArgType } => {
    const { filters } = query
    if (!filters || typeof filters !== 'string') {
        return {}
    }
    try {
        const json = JSON.parse(filters)
        const result = {}
        Object.keys(json).forEach((key) => {
            const value = json[key]
            if (Array.isArray(value)) {
                result[key] = value.filter((v) => typeof v === 'string' && Boolean(v))
            } else {
                if (typeof value === 'string' && !!value) result[key] = value
            }
        })
        return result
    } catch (e) {
        return {}
    }
}

export const getPageIndexFromOffset = (offset: number, pageSize: number): number => {
    return Math.floor(offset / pageSize) + 1
}

export const parseQuery = (query: ParsedUrlQuery): ParsedQueryType => {
    const filters = getFiltersFromQuery(query)
    const sorters = getSortersFromQuery(query)
    const queryOffset = get(query, 'offset', '0')
    const offset = Number(queryOffset) ? Number(queryOffset) : 0
    const queryTab = get(query, 'tab')
    const tab = Array.isArray(queryTab) ? undefined : queryTab
    const queryType = get(query, 'type')
    const type = Array.isArray(queryType) ? undefined : queryType
    return { filters, sorters, offset, tab, type }
}

export const convertColumns = (
    // TODO(mrfoxpro): write generic argument
    columns: ColumnInfo<any>[],
    filters: FiltersFromQueryType,
    sorters: Sorters
) => {
    const visibleWidth = columns
        .filter((column) => get(column, 'visible', true))
        .reduce((acc, current) => acc + current.width, 0)
    const totalWidth = columns.reduce((acc, current) => acc + current.width, 0)
    const freeSpace = totalWidth - visibleWidth
    const growSum = columns
        .filter((column) => get(column, 'visible', true))
        .reduce((acc, current) => {
            if (!current.hasOwnProperty('grow') || current.grow === undefined) return acc + 1
            return acc + current.grow
        }, 0)

    return columns.map((column) => {
        const columnGrow = get(column, 'grow', 1)
        const grownWidth = growSum === 0 ? 0 : (freeSpace) * columnGrow / growSum
        const proportionalWidth = (column.width + grownWidth) * 100 / totalWidth
        const percentageWidth = `${preciseFloor(proportionalWidth)}%`
        const isColumnVisible = get(column, 'visible', true)
        const responsive = isColumnVisible ? undefined : []

        const baseColumnInfo = {
            filteredValue: getFilterValue(column.key, filters),
            title: column.title,
            key: column.key,
            dataIndex: column.dataIndex,
            width: percentageWidth,
            ellipsis: column.ellipsis,
            filterIcon: undefined,
            filterDropdown: undefined,
            responsive,
            sorter: false,
            sortOrder: get(sorters, column.key),
            render: undefined,
        }
        if (column.filter) {
            const filter = column.filter
            baseColumnInfo.filterIcon = getFilterIcon
            if (filter.type === 'string') {
                const placeholder = filter.placeholder || column.title
                baseColumnInfo.filterDropdown = getTextFilterDropdown({ inputProps: { placeholder } })
            } else if (filter.type === 'stringOption' && filter.options.length > 0) {
                const loading = get(filter, 'loading', false)
                baseColumnInfo.filterDropdown = getOptionFilterDropdown({ checkboxGroupProps: {
                    options: filter.options,
                    disabled: loading,
                } })
            } else if (filter.type === 'date') {
                baseColumnInfo.filterDropdown = getDateFilterDropdown()
            } else if (filter.type === 'custom') {
                baseColumnInfo.filterDropdown = filter.filterDropdown
            }
        }
        if (column.sortable) {
            baseColumnInfo.sorter = true
        }
        if (column.render) {
            baseColumnInfo.render = column.render
        } else if (column.filter && column.filter.type === 'string') {
            const search = get(filters, 'search')
            if (!Array.isArray(search)) baseColumnInfo.render = getTextRender(search)
        }
        return baseColumnInfo
    })
}

export const getSorterMap: SorterMapType = (sorters) => {
    return Object.assign({}, ...sorters.map((sorter) => ({ [sorter.columnKey]: sorter.order })))
}

export const categoryToSearchQuery: (search: string, translations: ResolvedIntlConfig['messages']) => FilterType = (search, translations) => {
    if (!search) return () => null

    const searchLowerCase = search.toLowerCase()
    const whereIn = translations ? Object.keys(translations).filter(
        (key) => (
            key.includes('billing.category')
            && !key.includes('description')
            && (translations[key] as string).toLowerCase().includes(searchLowerCase)
        )
    ) : []

    return (search) =>  ({
        category: { 'OR': [
            { name_in: whereIn },
            { name_contains_i: search },
        ] },
    }) 
}