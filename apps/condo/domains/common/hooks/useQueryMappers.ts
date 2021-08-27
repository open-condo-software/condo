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
            .map((meta) => ({ [meta.keyword]: meta }))

        const filtersMap = Object.assign({}, ...validMetas)

        const filtersToWhere = (queryFilters) => {
            const whereQueries = []
            for (const [filterName, filterValue] of Object.entries(queryFilters)) {
                const responsibleFilters = get(filtersMap, filterName)
                if (responsibleFilters) {
                    const whereSubQueries = responsibleFilters.filters
                        .map((filter) => filter(filterValue || responsibleFilters.defaultValue))
                        .filter(Boolean)
                    if (whereSubQueries.length) {
                        const combineType = get(responsibleFilters, 'combineType', 'AND')
                        whereQueries.push({ [combineType]: whereSubQueries })
                    }
                }
            }

            return {
                AND: whereQueries,
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