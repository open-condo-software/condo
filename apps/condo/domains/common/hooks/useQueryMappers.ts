import { QueryMeta, SorterColumn, convertSortersToSortBy, getFiltersFromQuery, getSortersFromQuery } from '../utils/tables.utils'
import { useMemo } from 'react'
import get from 'lodash/get'
import { ParsedUrlQuery } from 'querystring'

export const useQueryMappers = (queryMetas: Array<QueryMeta>, sortableColumns: Array<string>) => {
    return useMemo(() => {
        const validSorts = sortableColumns.reduce((acc, cur) => {
            return [...acc, `${cur}_ASC`, `${cur}_DESC`]
        }, [])
        const validMetas = queryMetas
            .filter((meta) => meta && meta.keyword && meta.filters && meta.filters.length > 0)
            .map((meta) => ({ [meta.keyword]: meta }))

        const filtersMap = Object.assign({}, ...validMetas)

        const filtersToWhere = (queryFilters) => {
            const whereQueries = []
            for (const [key, value] of Object.entries(queryFilters)) {
                if (!filtersMap[key]) continue
                const queryFilters = filtersMap[key].filters
                    .map((filter) => filter(value))
                    .filter(Boolean)
                if (queryFilters.length) {
                    const combineType = get(filtersMap, [key, 'combineType'], 'AND')
                    whereQueries.push({ [combineType]: queryFilters })
                }
            }

            return whereQueries
        }

        const sortersToSortBy = (querySorts: SorterColumn | Array<SorterColumn>) => {
            return convertSortersToSortBy(querySorts)
                .filter((sortLine) => validSorts.includes(sortLine))
        }

        const parseQuery = (query: ParsedUrlQuery) => {
            const filters = getFiltersFromQuery(query)
            const sorters = getSortersFromQuery(query)
            return { filters, sorters }
        }

        return {
            filtersToWhere,
            sortersToSortBy,
            parseQuery,
        }

    }, [queryMetas, sortableColumns])
}