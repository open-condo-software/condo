import pickBy from 'lodash/pickBy'
import isString from 'lodash/isString'
import { updateQuery } from './filters.utils'
import { NextRouter } from 'next/router'
import { FiltersFromQueryType } from './tables.utils'

export enum FILTER_TABLE_KEYS {
    TICKET = 'ticketsFilter',
}

export class FiltersStorage {
    public static saveFilters (tableKey: FILTER_TABLE_KEYS, filters: FiltersFromQueryType | string): void {
        localStorage.setItem(tableKey, JSON.stringify(pickBy(filters)))
    }

    public static async loadFilters (tableKey: FILTER_TABLE_KEYS, router: NextRouter): Promise<void> {
        const filters = localStorage.getItem(tableKey)

        if (isString(filters)) {
            try {
                await updateQuery(router, JSON.parse(filters) as FiltersFromQueryType)
            } catch {
                return
            }
        }
    }

    public static clearFilters (tableKey: FILTER_TABLE_KEYS): void {
        localStorage.removeItem(tableKey)
    }
}