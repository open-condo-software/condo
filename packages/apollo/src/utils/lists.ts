import bindAll from 'lodash/bindAll'
import get from 'lodash/get'

import type { InitCacheOptions } from './cache'
import type { FieldReadFunction, FieldFunctionOptions } from '@apollo/client'

export type ListHelperOptions = {
    /** Name of the argument in GQL query, responsible for offset (skip / offset / etc.) */
    skipArgName?: string
    /** Name of the argument in GQL query, responsible for page size (first / limit / etc.) */
    firstArgName?: string
    /** Cache options. If cache is in write-only mode (skipped on read), the corresponding read function will be used */
    cacheOptions: InitCacheOptions
}

/**
 * Responsible for displaying objects on the client,
 * ‘showAll’ ignores the pagination arguments and returns the full list of objects
 * (useful if you have preloaded multiple stacks of objects in SSR),
 * ‘paginate’ returns the list slice according to the pagination arguments.
 */
export type ClientPaginationBehaviour = 'paginate' | 'showAll'

/**
 * This class contains the logic for working with GraphQL data represented as lists,
 * reading and merging them, with any pagination arguments.
 *
 * @example
 * const cacheConfig = (cacheOptions) => {
 *     const defaultListHelper = new ListHelper({ cacheOptions })
 *     const customListHelper = new ListHelper({ cacheOptions, skipArgName: 'offset', firstArgName: 'limit' })
 *
 *     return {
 *         typePolicies: {
 *             Query: {
 *                 fields: {
 *                     allContacts: {
 *                         keyArgs: ['where'],
 *                         read: defaultListHelper.getReadFunction('paginate'),
 *                         merge: defaultListHelper.mergeLists,
 *                     },
 *                     myCustomQuery: {
 *                         keyArgs: ['isPaid', 'accountNumber'],
 *                         read: customListHelper.getReadFunction('showAll'),
 *                         merge: customListHelper.mergeLists,
 *                     }
 *                 },
 *             },
 *         },
 *     }
 * }
 */
export class ListHelper {
    readonly skipArgName: string = 'skip'
    readonly firstArgName: string = 'first'
    readonly skipCacheOnRead: boolean = false

    constructor (options?: ListHelperOptions) {
        if (options?.skipArgName) {
            this.skipArgName = options.skipArgName
        }
        if (options?.firstArgName) {
            this.firstArgName = options.firstArgName
        }

        if (options?.cacheOptions.skipOnRead) {
            this.skipCacheOnRead = options.cacheOptions.skipOnRead
        }

        bindAll(this, '_readPage', '_networkOnlyRead', 'getReadFunction', 'mergeLists')
    }

    /**
     * Read function, which implements paginated reading from cache
     */
    private _readPage<TData, TOptions extends FieldFunctionOptions>(
        existing: ReadonlyArray<TData> | undefined,
        options: TOptions
    ): Array<TData> | undefined {
        const skip: number = get(options, ['args', this.skipArgName], 0)
        const first: number = get(options, ['args', this.firstArgName], 0)

        // NOTE: partial data (skip only) is not enough for case
        // where you fetch (page + 1) item to show "Next page" pagination event
        if (!existing || existing.length < skip + first) {
            return undefined
        }

        return existing.slice(skip, skip + first)
    }

    /**
     * Read function, which implements bypassing cache, so queries are forced to go to network
     */
    private _networkOnlyRead<TData>(): Array<TData> | undefined {
        return undefined
    }

    /**
     * Selects the appropriate read function depending on cache options and desired pagination behaviour
     */
    getReadFunction (clientPagination: ClientPaginationBehaviour): FieldReadFunction | undefined {
        if (this.skipCacheOnRead) {
            return this._networkOnlyRead
        }

        if (clientPagination === 'paginate') {
            return this._readPage
        }

        return undefined
    }

    /**
     * Merges a new data batch with an existing cache based on the pagination arguments
     */
    mergeLists<TData, TOptions extends FieldFunctionOptions>(
        existing: ReadonlyArray<TData> | undefined,
        incoming: ReadonlyArray<TData>,
        options: TOptions
    ): Array<TData | null> {
        // Copy array, so it's not ReadOnly anymore
        const merged: Array<TData | null> = existing ? existing.slice(0) : []

        const skip = get(options, ['args', this.skipArgName], 0)
        const first = get(options, ['args', this.firstArgName], 0)

        if (merged.length < skip + first) {
            // Expand array with empty items
            merged.length = skip + first
        }

        for (let i = 0; i < Math.max(incoming.length, first); i++) {
            merged[skip + i] = i < incoming.length ? incoming[i] : null
        }

        return merged
    }
}
