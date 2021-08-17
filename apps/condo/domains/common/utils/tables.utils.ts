import moment from 'moment'
import get from 'lodash/get'
import { ParsedUrlQuery } from 'querystring'

export type DataIndexType = string | Array<string>
export type QueryArgType = string | Array<string>
type OptionWhereArgumentType = Array<string> | Array<number>
type WhereArgumentType = string | number | boolean | OptionWhereArgumentType
export type WhereType = { [key: string]: WhereArgumentType | WhereType }
export type FilterType = (search: QueryArgType) => WhereType
export type ArgumentType = 'single' | 'array'
export type ArgumentDataType = 'string' | 'number' | 'dateTime' | 'boolean'
export type FiltersApplyMode = 'AND' | 'OR'

export type QueryMeta = {
    keyword: string
    filters: FilterType[]
    // by default === 'AND'
    combineType?: FiltersApplyMode
}

export type SorterColumn = {
    columnKey: string,
    order: 'ascend' | 'descend'
}

enum FULL_TO_SHORT_ORDERS_MAP {
    ascend = 'ASC',
    descend = 'DESC',
}

enum SHORT_TO_FULL_ORDERS_MAP {
    ASC = 'ascend',
    DESC = 'descend',
}

export const getFilter: (
    dataIndex: DataIndexType,
    argType: ArgumentType,
    argData: ArgumentDataType,
    suffix: string
) => FilterType = (
    dataIndex, argType, argData, suffix
) => {
    let wrappedDataIndex = []
    if (Array.isArray(dataIndex) && dataIndex.every(Boolean)) {
        wrappedDataIndex = dataIndex
    } else if (typeof dataIndex === 'string' && dataIndex) {
        wrappedDataIndex = [dataIndex]
    }
    return function (search) {
        if (wrappedDataIndex.length < 1) return
        let args = undefined
        if (argType === 'single' && Array.isArray(search)) return
        if (!Array.isArray(search)) {
            search = [search]
        }
        switch (argData) {
            case 'number':
                args = search.filter(Number).map(Number)
                break
            case 'dateTime':
                args = search
                    .filter((el) => moment(el).isValid())
                    .map((el) => moment(el).toISOString())
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
    return function (search) {
        if (!search) return
        const date = moment(search)
        if (!date.isValid()) return
        return filter(date.startOf('day').toISOString())
    }
}

export const getDayLteFilter: (dataIndex: DataIndexType) => FilterType = (dataIndex) => {
    const filter = getFilter(dataIndex, 'single', 'dateTime', 'lte')
    return function (search) {
        if (!search) return
        const date = moment(search)
        if (!date.isValid()) return
        return filter(date.endOf('day').toISOString())
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

