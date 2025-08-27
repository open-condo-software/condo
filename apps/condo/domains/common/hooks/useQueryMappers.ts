import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import { useMemo } from 'react'

import { QueryMeta, SorterColumn, convertSortersToSortBy } from '../utils/tables.utils'

const DEFAULT_SORT_BY = ['createdAt_DESC']

export const useQueryMappers = <F>(queryMetas: Array<QueryMeta<F>>, sortableColumns: Array<string>) => {
    return useMemo(() => {
        const validSorts = sortableColumns.reduce((acc, cur) => {
            return [...acc, `${cur}_ASC`, `${cur}_DESC`]
        }, [])

        const validMetas = queryMetas
            .filter((meta) => meta && meta.keyword && meta.filters && (isFunction(meta.filters) || meta.filters.length > 0))

        const filtersToWhere = (queryFilters) => {
            const whereQueries = []
            validMetas.forEach((meta) => {
                let searchValue = get(queryFilters, meta.keyword)
                const queryToWhereProcessor = meta.queryToWhereProcessor

                if (searchValue && queryToWhereProcessor) {
                    searchValue = queryToWhereProcessor(searchValue)
                }

                const filters = isFunction(meta.filters) ? meta.filters(searchValue || meta.defaultValue) : meta.filters
                const createdFilters = filters
                    .map((filter) => filter(searchValue || meta.defaultValue))
                    .filter(Boolean)
                
                if (createdFilters.length) {
                    const combineType = get(meta, 'combineType', 'AND')
                    whereQueries.push({ [combineType]: createdFilters })
                }
            })

            if (whereQueries.length) {
                return {
                    AND: whereQueries,
                }
            } else {
                return {}
            }
        }

        const sortersToSortBy = (querySorts: SorterColumn | Array<SorterColumn>, defaultSortBy?: string[]) => {
            const sortBy = defaultSortBy ? defaultSortBy : DEFAULT_SORT_BY
            const sorters = convertSortersToSortBy(querySorts)
                .filter((sortLine) => validSorts.includes(sortLine))

            return sorters.length ? sorters : sortBy
        }

        return {
            filtersToWhere,
            sortersToSortBy,
        }

    }, [queryMetas, sortableColumns])
}