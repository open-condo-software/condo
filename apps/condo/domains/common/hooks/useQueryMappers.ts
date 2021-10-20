import { QueryMeta, SorterColumn, convertSortersToSortBy } from '../utils/tables.utils'
import { useMemo } from 'react'
import get from 'lodash/get'

const DEFAULT_SORT_BY = ['createdAt_DESC']

export const useQueryMappers = <F>(queryMetas: Array<QueryMeta<F>>, sortableColumns: Array<string>) => {
    return useMemo(() => {
        const validSorts = sortableColumns.reduce((acc, cur) => {
            return [...acc, `${cur}_ASC`, `${cur}_DESC`]
        }, [])
        const validMetas = queryMetas
            .filter((meta) => meta && meta.keyword && meta.filters && meta.filters.length > 0)

        const filtersToWhere = (queryFilters) => {
            const whereQueries = []
            validMetas.forEach((meta) => {
                let searchValue = get(queryFilters, meta.keyword)

                const queryToWhereProcessor = meta.queryToWhereProcessor
                if (searchValue && queryToWhereProcessor) {
                    searchValue = queryToWhereProcessor(searchValue)
                }

                const createdFilters = meta.filters
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

        const sortersToSortBy = (querySorts: SorterColumn | Array<SorterColumn>) => {
            const sorters = convertSortersToSortBy(querySorts)
                .filter((sortLine) => validSorts.includes(sortLine))
            return sorters.length ? sorters : DEFAULT_SORT_BY
        }

        return {
            filtersToWhere,
            sortersToSortBy,
        }

    }, [queryMetas, sortableColumns])
}