import { InvalidationPolicyCache } from '@nerdwallet/apollo-cache-policies'
import merge from 'deepmerge'
import isEqual from 'lodash/isEqual'

import type { NormalizedCacheObject, ApolloClient } from '@apollo/client'
import type { InvalidationPolicyCacheConfig } from '@nerdwallet/apollo-cache-policies'

export interface InvalidationCacheConfig extends InvalidationPolicyCacheConfig {
    cacheIdentityKey?: string | Array<string>
}

export type InitCacheOptions = {
    /** If true, cache read functions must return undefined,
     * so all request goes to network, but merge functions should work as normal, so cache is filled with incoming data */
    skipOnRead: boolean
}

/** Initialize cache config based on client requirements, such as skipOnRead */
export type InitCacheConfig = (options: InitCacheOptions) => InvalidationCacheConfig

type AddCacheOptions =  {
    /** If true, all current apollo queries will be notified and refreshed if needed */
    broadcast?: boolean
    /** If true, additional cache will be added on top of client's cache, otherwise - under the client's cache */
    overrideClient?: boolean
}

const DEFAULT_IDENTITY_PATH = ['ROOT_QUERY', 'authenticatedUser', '__ref']

/**
 * Basic Apollo cache with the following features:
 * 1. data invalidation, which can occur according to TTL (globally or per-list / per-type level).
 * 2. cache identity. The cache is bound to the user, so that when a cookie is changed,
 * the cache from the previous user is not loaded to the user from persisted sources such as localStorage
 * @example
 * const cache = new InvalidationCache({
 *     invalidationPolicies: {
 *         timeToLive: 15 * 60 * 1000, // 15 minutes in milliseconds,
 *         types: {
 *             Contact: {
 *                 timeToLive: 2 * 60 * 60 * 1000, // 2 hours in milliseconds,
 *             },
 *         },
 *     },
 *     cacheIdentityKey: ['ROOT_QUERY', 'authenticatedUser', 'id'],
 * })
 */
export class InvalidationCache extends InvalidationPolicyCache {
    readonly cacheIdentityKey: string | Array<string> = DEFAULT_IDENTITY_PATH

    constructor (config?: InvalidationCacheConfig) {
        super(config)

        if (config?.cacheIdentityKey) {
            this.cacheIdentityKey = config.cacheIdentityKey
        }
    }
}

/**
 * Wrapper, which is used to create cache instance by this package logic,
 * since specific class / implementation can be changed later
 * @example
 * const cache = createApolloCache({
 *     invalidationPolicies: {
 *         timeToLive: 15 * 60 * 1000, // 15 minutes in milliseconds,
 *         types: {
 *             Contact: {
 *                 timeToLive: 2 * 60 * 60 * 1000, // 2 hours in milliseconds,
 *             },
 *         },
 *     },
 *     cacheIdentityKey: ['ROOT_QUERY', 'authenticatedUser', 'id'],
 * })
 */
export function createApolloCache (config?: InvalidationCacheConfig): InvalidationCache {
    return new InvalidationCache(config)
}

/**
 * Merges two normalized cache object, obtained from cache.extract()
 * @param baseCache - original cache, which will be used as baseline
 * @param additionalCache - additional data, which will be added on top of base cache
 */
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

/**
 * Extracts cache data from apollo client,
 * when merges it together with incoming cache,
 * and loads it back into the client
 * @param client - apollo client to extract cache from
 * @param cache - cache, obtained from other source (usually from persistor)
 * @param options - merge parameters
 * @param options.broadcast - If true, all current apollo queries will be notified and refreshed if needed
 * @param options.overrideClient - If true, additional cache will be added on top of client's cache,
 * otherwise - under the client's cache
 */
export function addCacheToClient (
    client: ApolloClient<NormalizedCacheObject>,
    cache: NormalizedCacheObject,
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
