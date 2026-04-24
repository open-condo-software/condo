import { ApolloClient, from } from '@apollo/client/core'
import { createUploadLink } from 'apollo-upload-client'
import bindAll from 'lodash/bindAll'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { useMemo, useState } from 'react'

import { isSSR } from '@open-condo/miniapp-utils/helpers/environment'
import { useEffectOnce } from '@open-condo/miniapp-utils/hooks/useEffectOnce'
import { usePrevious } from '@open-condo/miniapp-utils/hooks/usePrevious'


import { addCacheToClient, createApolloCache } from './cache'
import { createPersistor } from './cachePersistor'

import { APOLLO_STATE_PROP_NAME } from '../constants'

import type { InitCacheConfig, InitCacheOptions, InvalidationCacheConfig } from './cache'
import type { CachePersistor } from './cachePersistor'
import type { NormalizedCacheObject, ApolloCache, ApolloLink, RequestHandler } from '@apollo/client'

type ApolloClientOptions = {
    /** Apollo server url, can be static string or obtained from function on the fly */
    uri: (() => string) | string
    /** Headers to include in each request, can be helpful in SSR environments */
    headers?: Record<string, string>
    /** Client's cache config */
    cacheConfig?: InvalidationCacheConfig
    /** Middleware to process / enrich requests */
    middlewares?: Array<ApolloLink | RequestHandler>
    /** Default context to pass to apollo links */
    defaultContext?: Record<string, unknown>
}

export type InitApolloClientOptions = Partial<Omit<ApolloClientOptions, 'cacheConfig'>> & {
    /** Results in cache being initialized with skipOnRead */
    networkOnly?: boolean
}

export type ApolloHelperOptions = Omit<ApolloClientOptions, 'cacheConfig'> & {
    /** Cache initializer */
    cacheConfig?: InitCacheConfig
}

type SSRResult<PropsType> = {
    props: PropsType & {
        [APOLLO_STATE_PROP_NAME]?: NormalizedCacheObject
    }
}

// TODO(SavelevMatthew): Remove TClient entirely or extend it from apollo client after resolving monorepo type mismatch issue

type UseApolloHookResult<TClient> = {
    client: TClient
    cachePersistor: CachePersistor<NormalizedCacheObject> | undefined
}

export type InitializeApollo<TClient> = (options?: InitApolloClientOptions) => TClient
export type UseApollo<TClient> = <PropsType> (pageProps: SSRResult<PropsType>['props']) => UseApolloHookResult<TClient>

interface ApolloHelperInterface {
    initializeApollo: InitializeApollo<ApolloClient<NormalizedCacheObject>>
    generateUseApolloHook: () => UseApollo<ApolloClient<NormalizedCacheObject>>
}

// NOTE: This type is used to avoid monorepo type mismatch issues,
// see README.md for details
type ClientWithExtractableCache = {
    cache: Pick<ApolloCache<NormalizedCacheObject>, 'extract'>
}

/**
 * Creates new apollo client with InvalidationCache
 */
function createApolloClient (options: ApolloClientOptions): ApolloClient<NormalizedCacheObject> {
    const middlewares = options.middlewares || []
    const httpLink = createUploadLink({
        uri: typeof options.uri === 'string' ? options.uri : options.uri(),
        headers: options.headers,
        credentials: 'include',
        fetchOptions: {
            mode: 'cors',
        },
    }) as unknown as ApolloLink

    const link = from([...middlewares, httpLink])

    return new ApolloClient({
        ssrMode: isSSR(),
        link,
        cache: createApolloCache(options.cacheConfig),
        defaultContext: options.defaultContext,
    })
}

/**
 * Extracts apollo cache from client and modify page props to include it,
 * so all data prefetched in SSR can be passed to client.
 * @example
 * export const getServerSideProps = async ({ req }) => {
 *     const headers = extractHeaders(req)
 *     const client = initializeApollo({ headers })
 *
 *     const { data } = await client.query({ ... })
 *
 *     return extractApolloState(client, {
 *         props: { ... }
 *     })
 * }
 */
export function extractApolloState<PropsType> (
    client: ClientWithExtractableCache,
    pageParams: SSRResult<PropsType>
): SSRResult<PropsType> {
    if (pageParams?.props) {
        pageParams.props[APOLLO_STATE_PROP_NAME] = client.cache.extract()
    }

    return pageParams
}

/**
 * Apollo helper which is used to generate utils for CSR / SSR, based on common client configuration
 *
 * @example Init helper and export utils for app
 * import { ListHelper, ApolloHelper } from '@open-condo/apollo'
 * import { TracingMiddleware } from '@open-condo/miniapp-utils/apollo'
 * import type { InitCacheConfig } from '@open-condo/apollo'
 *
 * const cacheConfig: InitCacheConfig = (cacheOptions) => {
 *     const defaultListHelper = new ListHelper({ cacheOptions })
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
 *                 },
 *             },
 *         },
 *     }
 * }
 *
 * const apolloHelper = new ApolloHelper({
 *     middlewares: [
 *         new TracingMiddleware()
 *     ],
 *     uri: 'http://localhost:3000',
 *     cacheConfig,
 * })
 *
 * export const initializeApollo = apolloHelper.initializeApollo
 * export const useApollo = apolloHelper.generateUseApolloHook()
 * export { extractApolloState } from '@open-condo/apollo'
 *
 * @example Use in SSR
 * import { initializeApollo, extractApolloState } from '@/domains/common/utils/apollo'
 *
 * export const getServerSideProps = async ({ req }) => {
 *     const headers = extractHeaders(req)
 *     const client = initializeApollo({ headers })
 *
 *     const { data } = await client.query({ ... })
 *
 *     return extractApolloState(client, {
 *         props: { ... }
 *     })
 * }
 *
 * @example Init on client in _app.tsx
 * export default function App ({ Component, pageProps }: AppProps): ReactNode {
 *     const { client, cachePersistor } = useApollo(pageProps)
 *
 *     return (
 *         <ApolloProvider client={client}>
 *             <CachePersistorContext.Provider value={{ persistor: cachePersistor }}>
 *                 <Component {...pageProps} />
 *             </CachePersistorContext.Provider>
 *         </ApolloProvider>
 *     )
 * }
 */
export class ApolloHelper implements ApolloHelperInterface {
    /** Initial options */
    private readonly _initialApolloOptions: ApolloClientOptions
    /** Cache initializer */
    private readonly _cacheConfig?: InitCacheConfig
    /** Apollo client to reuse on CSR */
    private _apolloClient: ApolloClient<NormalizedCacheObject> | undefined

    constructor (options: ApolloHelperOptions) {
        const { cacheConfig, ...restOptions } = options
        this._initialApolloOptions = restOptions
        this._cacheConfig = cacheConfig


        bindAll(this, '_getCacheConfig', 'initializeApollo', 'generateUseApolloHook')
    }

    /**
     * Generates cache config to init cache,
     * based on cache initializer and some client options
     */
    private _getCacheConfig (networkOnly?: boolean) {
        // NOTE: Must be true by default, since most the of calls from SSR
        const skipOnRead: boolean = (networkOnly === undefined) || networkOnly
        const cacheOptions: InitCacheOptions = {
            skipOnRead,
        }
        return this._cacheConfig
            ? this._cacheConfig(cacheOptions)
            : undefined
    }

    /**
     * Creates new apollo client, if necessary with specified cache configuration
     *
     * When in SSR, generates new apollo client via createApolloClient util on each initializeApollo call
     * When in CSR, generate new apollo client once and then reuses it on subsequent initializeApollo calls
     *
     * You should probably use it only in SSR utils, such as getServerSideProps,
     * on client you should use useApollo hook instead
     *
     * @example Use in SSR
     * export const getServerSideProps = async ({ req }) => {
     *     const headers = extractHeaders(req)
     *     const client = initializeApollo({ headers })
     *
     *     const { data } = await client.query({ ... })
     *
     *     return extractApolloState(client, {
     *         props: { ... }
     *     })
     * }
     */
    initializeApollo (options?: InitApolloClientOptions): ApolloClient<NormalizedCacheObject> {
        const { networkOnly, ...restOptions } = (options || {})

        const cacheConfig = this._getCacheConfig(networkOnly)

        const apolloOptions: ApolloClientOptions = {
            ...this._initialApolloOptions,
            ...restOptions,
            cacheConfig,
        }

        if (isSSR()) {
            return createApolloClient(apolloOptions)
        }

        if (!this._apolloClient) {
            this._apolloClient = createApolloClient(apolloOptions)
        }

        return this._apolloClient
    }

    /**
     * Generates useApollo hook to init apollo in react tree and pass it to whole app using default ApolloProvider
     *
     * @example
     * export default function App ({ Component, pageProps }: AppProps): ReactNode {
     *     const { client, cachePersistor } = useApollo(pageProps)
     *
     *     return (
     *         <ApolloProvider client={client}>
     *             <CachePersistorContext.Provider value={{ persistor: cachePersistor }}>
     *                 <Component {...pageProps} />
     *             </CachePersistorContext.Provider>
     *         </ApolloProvider>
     *     )
     * }
     */
    generateUseApolloHook (): <PropsType> (pageProps: SSRResult<PropsType>['props']) => UseApolloHookResult<ApolloClient<NormalizedCacheObject>> {
        const initApollo = this.initializeApollo
        const initCacheConfig = this._getCacheConfig

        return function useApollo<PropsType> (pageProps: SSRResult<PropsType>['props']): {
            client: ApolloClient<NormalizedCacheObject>
            cachePersistor: CachePersistor<NormalizedCacheObject> | undefined
        } {
            // NOTE: undefined, while localStorage cache is loaded
            const [cachePersistor, setCachePersistor] = useState<CachePersistor<NormalizedCacheObject>>()

            // Obtain SSR state from pageProps
            const ssrState = pageProps[APOLLO_STATE_PROP_NAME]
            const prevState = usePrevious(ssrState)

            const client = useMemo(() => {
                // Init apollo client or reuse global existing one
                const apollo = initApollo({ networkOnly: false })

                // Add SSR state in cache on top of existing cache
                // NOTE: SSR should go on top of existing cache, since its always fresh
                if (ssrState && !isEqual(ssrState, prevState)) {
                    addCacheToClient(apollo, ssrState, {
                        overrideClient: true,
                        broadcast: true,
                    })

                    // If async cache is initialized at this point -> save it to localStorage
                    if (cachePersistor) {
                        cachePersistor.persist()
                    }
                }

                return apollo
            }, [cachePersistor, prevState, ssrState])

            useEffectOnce(() => {
                async function initPersistor () {
                    // Create separate cache, in which localStorage data will be stored
                    const cache = createApolloCache(initCacheConfig(false))
                    const loaderPersistor = createPersistor(cache)

                    // IMPORTANT: Restore client side persisted data before letting the application run any queries
                    await loaderPersistor.restore()

                    // NOTE: At this point we have async filled cache, but:
                    // 1. apollo SSR cache is already filled in sync mode
                    // 2. async cache from local storage can be owned / left by another user
                    // So we need to compare identities first

                    const cacheIdentityKey = cache.cacheIdentityKey
                    const asyncIdentity = get(cache.extract(), cacheIdentityKey, null)
                    const clientIdentity = get(client.cache.extract(), cacheIdentityKey, null)

                    // If user is not authorized (no identity) or identity not matched -> clear async store
                    if (!clientIdentity || !isEqual(clientIdentity, asyncIdentity)) {
                        await loaderPersistor.purge()
                        await cache.reset()
                    }

                    addCacheToClient(client, cache.extract(), {
                        broadcast: true,
                        overrideClient: false,
                    })

                    // NOTE: At this point we have restored async cache and current apollo one on top,
                    // and everything is stored in client, so we need another persistor
                    // which will be connected to actual client's cache

                    const finalPersistor = createPersistor(client.cache)

                    // Set persistor, everything is ready now
                    setCachePersistor(finalPersistor)
                }

                initPersistor()
            })

            return { client, cachePersistor }
        }
    }
}
