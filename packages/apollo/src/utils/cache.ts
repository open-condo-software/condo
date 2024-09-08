import { InvalidationPolicyCache } from '@nerdwallet/apollo-cache-policies'

import type { InvalidationPolicyCacheConfig } from '@nerdwallet/apollo-cache-policies'

interface InvalidationCacheConfig extends InvalidationPolicyCacheConfig {
    cacheIdentityKey: string | Array<string>
}

export type InitCacheOptions = {
    skipOnRead: boolean
}

export type InitCacheConfig = (options: InitCacheOptions) => InvalidationCacheConfig

export class InvalidationCache extends InvalidationPolicyCache {
    // TODO: auth default
    readonly cacheIdentityKey: string | Array<string> = 'id'

    constructor (config: InvalidationCacheConfig) {
        super(config)
        this.cacheIdentityKey = config.cacheIdentityKey
    }
}
