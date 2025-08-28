import bindAll from 'lodash/bindAll'

import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'

import type { InitCacheOptions } from './cache'
import type { FieldReadFunction, FieldFunctionOptions, Reference } from '@apollo/client'
import type { NormalizedCacheObject } from '@apollo/client/core'

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
 * Checks if the provided value is an Apollo Client Reference object
 * Used to determine if a value in the cache is a reference to another cached object
 * 
 * @param ref - Value to check for Reference type
 * @returns True if the value is an Apollo Reference object, false otherwise
 */
function hasRef (ref: unknown): ref is Reference {
    return (
        typeof ref === 'object' &&
        ref !== null &&
        '__ref' in ref &&
        typeof ref.__ref === 'string'
    )

}

/**
 * Validates if a list of cached items contains any broken references
 * A broken reference occurs when a Reference object points to a cache entry that doesn't exist
 * This is used to ensure data integrity when reading from the Apollo cache
 * 
 * @param list - Array of potentially cached items to check
 * @param cache - Apollo normalized cache object
 * @returns True if the list contains any broken references, false if all references are valid or if list contain non-reference items
 */
function hasBrokenRefs (
    list: ReadonlyArray<unknown>,
    cache: NormalizedCacheObject,
) {
    return list.some((ref) => {
        if (hasRef(ref)) {
            const itemRef = ref.__ref
            return itemRef && !(itemRef in cache)
        }
        return false
    })
}

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

        bindAll(this, '_readPage', '_readAll', '_networkOnlyRead', 'getReadFunction', 'mergeLists')
    }

    /**
     * Read function that implements paginated reading from cache.
     * Returns a slice of the cached list based on pagination arguments.
     * Includes validation of data integrity by checking for broken references
     * (references to objects that don't exist in the cache).
     */
    private _readPage<TData, TOptions extends FieldFunctionOptions>(
        existing: ReadonlyArray<TData> | undefined,
        options: TOptions
    ): Array<TData> | undefined {
        const skip: number = options?.args?.[this.skipArgName] || 0
        const first: number = options?.args?.[this.firstArgName] || 0

        // NOTE: partial data (skip only) is not enough for case
        // where you fetch (page + 1) item to show "Next page" pagination event
        if (!existing || existing.length < skip + first) {
            return undefined
        }

        const filteredItems = existing.slice(skip, skip + first).filter(nonNull)

        const cache = options.cache.extract()

        if (hasBrokenRefs(filteredItems, cache)) return undefined

        return filteredItems
    }

    /**
     * Read function that returns the complete list from cache without pagination.
     * Includes validation of data integrity by checking for broken references
     * (references to objects that don't exist in the cache).
     */
    private _readAll<TData, TOptions extends FieldFunctionOptions>(
        existing: ReadonlyArray<TData> | undefined,
        options: TOptions
    ): Array<TData> | undefined {
        if (!existing) {
            return undefined
        }

        const cache = options.cache.extract()

        const filteredItems = existing.filter(nonNull)
        if (hasBrokenRefs(filteredItems, cache)) {
            return undefined
        }

        return filteredItems
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
    getReadFunction (clientPagination: ClientPaginationBehaviour): FieldReadFunction {
        if (this.skipCacheOnRead) {
            return this._networkOnlyRead
        }

        if (clientPagination === 'paginate') {
            return this._readPage
        }

        return this._readAll
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

        const skip = options?.args?.[this.skipArgName] || 0
        const first = options?.args?.[this.firstArgName] || 0

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
