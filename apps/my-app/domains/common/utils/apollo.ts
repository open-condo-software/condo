import getConfig from 'next/config'

import { ApolloHelper } from '@open-condo/apollo'
import type { InitCacheConfig, UseApollo } from '@open-condo/apollo'
import { getTracingMiddleware } from '@open-condo/miniapp-utils/helpers/apollo'

import type { TRPCContext } from '@/domains/common/utils/trpc.server'
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client'

const { publicRuntimeConfig: { condoDomain, revision } } = getConfig()

/**
 * Caching configuration for Apollo client. By default, all queries are cached for 15 minutes and cache key consists of all args.
 * If you want to change that behavior, you can use list helpers from `@open-condo/apollo`.
 * @param _cacheOptions
 */
const cacheConfig: InitCacheConfig = (_cacheOptions) => {
    return {
        invalidationPolicies: {
            timeToLive: 15 * 60 * 1000, // 15 minutes in milliseconds
        },
    }
}

const apolloHelper = new ApolloHelper({
    uri: `${condoDomain}/admin/api`,
    cacheConfig,
    middlewares: [
        getTracingMiddleware({
            serviceUrl: typeof window !== 'undefined' ? window?.location.origin : '',
            codeVersion: revision ?? '',
            target: 'miniapps',
        }),
    ],
})

export function initializeServerApolloClient (ctx: TRPCContext) {
    const headers: Record<string, string> = {}
    if (ctx.condoAccessToken) {
        headers['authorization'] = `Bearer ${ctx.condoAccessToken}`
    }
    if (ctx.req.headers['accept-language']) {
        headers['accept-language'] = ctx.req.headers['accept-language']
    }

    return apolloHelper.initializeApollo({ headers })
}
export const useApollo = apolloHelper.generateUseApolloHook() as unknown as UseApollo<ApolloClient<NormalizedCacheObject>>

