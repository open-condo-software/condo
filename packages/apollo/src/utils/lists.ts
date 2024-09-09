import get from 'lodash/get'

import type { InitCacheOptions } from './cache'

type ReadListFunction = <TData, TOptions extends Record<string, unknown>>(
    existing: ReadonlyArray<TData> | undefined,
    options: TOptions
) => Array<TData> | undefined

export type ListHelperOptions = {
    skipArgName?: string
    firstArgName?: string
    cacheOptions: InitCacheOptions
}

export type ClientPaginationBehaviour = 'paginate' | 'showAll'

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
    }

    readPage<TData, TOptions>(
        existing: ReadonlyArray<TData> | undefined,
        options: TOptions
    ): Array<TData> | undefined {
        const skip: number = get(options, ['args', this.skipArgName], 0)
        const first: number = get(options, ['args', this.firstArgName], 0)

        if (!existing || existing.length <= skip) {
            return undefined
        }

        return existing.slice(skip, skip + first)
    }

    networkOnlyRead<TData>(): Array<TData> | undefined {
        return undefined
    }

    getReadFunction (clientPagination: ClientPaginationBehaviour): ReadListFunction | undefined {
        if (this.skipCacheOnRead) {
            return this.networkOnlyRead
        }

        if (clientPagination === 'paginate') {
            return this.readPage
        }

        return undefined
    }

    mergeLists<TData, TOptions>(
        existing: ReadonlyArray<TData> | undefined,
        incoming: ReadonlyArray<TData>,
        options: TOptions
    ): Array<TData> {
        // Copy array, so it's not ReadOnly anymore
        const merged = existing ? existing.slice(0) : []

        const skip = get(options, ['args', this.skipArgName], 0)
        const first = get(options, ['args', this.firstArgName], 0)

        if (merged.length < skip + first) {
            // Expand array with empty items
            merged.length = skip + first
        }

        for (let i = 0; i < incoming.length; i++) {
            merged[skip + i] = incoming[i]
        }

        return merged
    }
}
