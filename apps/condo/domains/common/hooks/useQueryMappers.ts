import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import { useMemo } from 'react'

import type { SortState } from '@open-condo/ui'

import { QueryMeta, SorterColumn, convertSortersToSortBy } from '../utils/tables.utils'

const DEFAULT_SORT_BY = ['createdAt_DESC']

export const useQueryMappers = <F>(queryMetas: Array<QueryMeta<F>>, sortableColumns: Array<string> | null) => {
    return useMemo(() => {
        const validSorts = Array.isArray(sortableColumns)
            ? sortableColumns.reduce((acc, cur) => [...acc, `${cur}_ASC`, `${cur}_DESC`], [])
            : null

        const validMetas = queryMetas
            .filter((meta) => meta?.keyword && meta.filters && (isFunction(meta.filters) || meta.filters.length > 0))

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

        const sortersToSortBy = (
            querySorts: SorterColumn | Array<SorterColumn> | SortState,
            defaultSortBy?: Array<string>,
        ) => {
            const defaultSorters = defaultSortBy ?? DEFAULT_SORT_BY
            if (!querySorts || (Array.isArray(querySorts) && querySorts.length === 0)) return defaultSorters

            if (Array.isArray(querySorts) && querySorts.every((s) => 'id' in s)) {
                return querySorts
                    .map((s) => `${s.id}_${s.desc ? 'DESC' : 'ASC'}`)
                    .filter(Boolean)
            }

            const sorters = validSorts 
                ? 
                convertSortersToSortBy(querySorts).filter((sortLine) => validSorts.includes(sortLine)) 
                : 
                []

            return sorters.length ? sorters : defaultSorters
        }

        return {
            filtersToWhere,
            sortersToSortBy,
        }

    }, [queryMetas, sortableColumns])
}
