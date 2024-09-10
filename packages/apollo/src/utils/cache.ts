import { InvalidationPolicyCache } from '@nerdwallet/apollo-cache-policies'
import merge from 'deepmerge'
import isEqual from 'lodash/isEqual'

import type { NormalizedCacheObject, ApolloClient } from '@apollo/client'
import type { InvalidationPolicyCacheConfig } from '@nerdwallet/apollo-cache-policies'

export interface InvalidationCacheConfig extends InvalidationPolicyCacheConfig {
    cacheIdentityKey: string | Array<string>
}

export type InitCacheOptions = {
    skipOnRead: boolean
}

export type InitCacheConfig = (options: InitCacheOptions) => InvalidationCacheConfig

type AddCacheOptions =  {
    broadcast?: boolean
    overrideClient?: boolean
}

export class InvalidationCache extends InvalidationPolicyCache {
    // TODO: auth default
    readonly cacheIdentityKey: string | Array<string> = 'id'

    constructor (config?: InvalidationCacheConfig) {
        super(config)

        if (config?.cacheIdentityKey) {
            this.cacheIdentityKey = config.cacheIdentityKey
        }
    }
}

export function createApolloCache (config?: InvalidationCacheConfig): InvalidationCache {
    return new InvalidationCache(config)
}

function mergeCaches (
    baseCache: NormalizedCacheObject,
    additionalCache: NormalizedCacheObject
): NormalizedCacheObject {
    return merge(baseCache, additionalCache, {
        arrayMerge: (destinationArray, sourceArray) => [
            ...sourceArray,
            ...destinationArray.filter(destItem =>
                sourceArray.every(srcItem => !isEqual(destItem, srcItem))
            ),
        ],
    })
}

export function addCacheToClient (
    client: ApolloClient<NormalizedCacheObject>,
    cache: NormalizedCacheObject | undefined,
    options: AddCacheOptions
): void {
    if (!cache) return

    const clientCache = client.cache.extract()

    const baseCache  = options.overrideClient ? clientCache : cache
    const additionalCache = options.overrideClient ? cache : clientCache

    const newCache = mergeCaches(baseCache, additionalCache)

    client.cache.restore(newCache)

    if (options.broadcast) {
        // NOTE: restore does not trigger queries broadcasting by default, but modify does.
        // So calling empty modify will trigger queries broadcasting (updating data)
        client.cache.modify({ fields: {} })
    }
}