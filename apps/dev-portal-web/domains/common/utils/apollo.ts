import getConfig from 'next/config'

import { ListHelper, ApolloHelper } from '@open-condo/apollo'
import type { InitCacheConfig, InitializeApollo, UseApollo } from '@open-condo/apollo'
import { getTracingMiddleware, getSSRProxyingMiddleware } from '@open-condo/miniapp-utils/helpers/apollo'
import { isDebug, isSSR } from '@open-condo/miniapp-utils/helpers/environment'

import type {
    NormalizedCacheObject,
    ApolloClient,
} from '@apollo/client'

const {
    publicRuntimeConfig: { serviceUrl, revision },
    serverRuntimeConfig: { ssrProxyConfig },
} = getConfig()

const API_URL_PATH = '/api/graphql'

/**
 * Gets API url.
 * If it's in SSR / production the absolute url is used
 * In dev mode relative url is allowed on a client,
 * so you can debug app on another device sharing the same network
 */
function getApiUrl () {
    if (isDebug() && !isSSR()) {
        return API_URL_PATH
    }

    return `${serviceUrl}${API_URL_PATH}`
}

const cacheConfig: InitCacheConfig = (cacheOptions) => {
    const helper = new ListHelper({ cacheOptions })

    return {
        typePolicies: {
            Query: {
                fields: {
                    allB2CApps: {
                        keyArgs: ['where', 'sortBy'],
                        merge: helper.mergeLists,
                        read: helper.getReadFunction('paginate'),
                    },
                    allB2CAppBuilds: {
                        keyArgs: ['where', 'sortBy'],
                        merge: helper.mergeLists,
                        read: helper.getReadFunction('paginate'),
                    },
                },
            },
        },
        invalidationPolicies: {
            timeToLive: 15 * 60 * 1000, // 15 minutes in milliseconds
        },
    }
}

const apolloHelper = new ApolloHelper({
    uri: getApiUrl,
    cacheConfig,
    middlewares: [
        getSSRProxyingMiddleware({
            apiUrl: API_URL_PATH,
            proxyId: ssrProxyConfig?.proxyId,
            proxySecret: ssrProxyConfig?.proxySecret,
        }),
        getTracingMiddleware({
            serviceUrl,
            codeVersion: revision,
        }),
    ],
})

// NOTE: Type casting is used for apollo type mismatch
export const initializeApollo = apolloHelper.initializeApollo as InitializeApollo<ApolloClient<NormalizedCacheObject>>
export const useApollo = apolloHelper.generateUseApolloHook() as UseApollo<ApolloClient<NormalizedCacheObject>>

export { extractApolloState } from '@open-condo/apollo'
export { prepareSSRContext } from '@open-condo/miniapp-utils/helpers/apollo'
