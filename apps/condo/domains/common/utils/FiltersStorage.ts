import pickBy from 'lodash/pickBy'
import isString from 'lodash/isString'
import { updateQuery } from './filters.utils'
import { NextRouter } from 'next/router'
import { FiltersFromQueryType } from './tables.utils'
import isEmpty from 'lodash/isEmpty'

export enum FILTER_TABLE_KEYS {
    TICKET = 'ticketsFilter',
}

export class FiltersStorage {
    private static getFilters(tableKey: FILTER_TABLE_KEYS) {
        const filters = localStorage.getItem(tableKey)

        if (isString(filters)) {
            try {
                return JSON.parse(filters)
            } catch {
                return {}
            }
        }
    }

    public static saveFilters(organizationId: string, tableKey: FILTER_TABLE_KEYS, filters: FiltersFromQueryType | string): void {
        const oldFilters = this.getFilters(tableKey)

        const dataToSave = pickBy({ ...oldFilters, [organizationId]: filters })

        if (isEmpty(dataToSave[organizationId])) {
            delete dataToSave[organizationId]
        }

        if (!isEmpty(dataToSave)) {
            localStorage.setItem(tableKey, JSON.stringify(dataToSave))
        } else {
            localStorage.removeItem(tableKey)
        }
    }

    public static async loadFilters(organizationId: string, tableKey: FILTER_TABLE_KEYS, router: NextRouter): Promise<void> {
        const filters = this.getFilters(tableKey)

        if (filters) {
            await updateQuery(router, filters[organizationId] as FiltersFromQueryType)
        }
    }

    public static clearFilters(organizationId: string, tableKey: FILTER_TABLE_KEYS): void {
        const oldFilters = this.getFilters(tableKey)
        const newFilters = pickBy(oldFilters, (_, key) => key !== organizationId)

        if (isEmpty(newFilters)) {
            localStorage.removeItem(tableKey)
        } else {
            localStorage.setItem(tableKey, JSON.stringify(newFilters))
        }
    }
}
