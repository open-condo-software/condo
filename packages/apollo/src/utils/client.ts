import { ApolloClient, from } from '@apollo/client'
import { createUploadLink } from 'apollo-upload-client'
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
import type { ApolloLink, NormalizedCacheObject } from '@apollo/client'

type ApolloClientOptions = {
    uri: (() => string) | string
    headers?: Record<string, string>
    cacheConfig?: InvalidationCacheConfig
    middlewares?: Array<ApolloLink>
}

type InitApolloClientOptions = Partial<Omit<ApolloClientOptions, 'cacheConfig'>> & {
    networkOnly?: boolean
}

type ApolloHelperOptions = Omit<ApolloClientOptions, 'cacheConfig'> & {
    cacheConfig?: InitCacheConfig
}

type SSRResult<PropsType> = {
    props: PropsType & {
        [APOLLO_STATE_PROP_NAME]?: NormalizedCacheObject
    }
}

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
    })
}

export function extractApolloState<PropsType> (
    client: ApolloClient<NormalizedCacheObject>,
    pageParams: SSRResult<PropsType>
): SSRResult<PropsType> {
    if (pageParams?.props) {
        pageParams.props[APOLLO_STATE_PROP_NAME] = client.cache.extract()
    }

    return pageParams
}

export class ApolloHelper {
    private readonly _initialApolloOptions: ApolloClientOptions
    private readonly _cacheConfig?: InitCacheConfig
    private _apolloClient: ApolloClient<NormalizedCacheObject> | undefined

    constructor (options: ApolloHelperOptions) {
        const { cacheConfig, ...restOptions } = options
        this._initialApolloOptions = restOptions
        this._cacheConfig = cacheConfig
    }

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

    generateHook () {
        const initApollo = this.initializeApollo
        const initCacheConfig = this._getCacheConfig

        return function useApollo<PropsType> (pageProps: SSRResult<PropsType>['props']): {
            client: ApolloClient<NormalizedCacheObject>
            cachePersistor: CachePersistor<NormalizedCacheObject> | undefined
        } {
            const [cachePersistor, setCachePersistor] = useState<CachePersistor<NormalizedCacheObject>>()

            const ssrState = pageProps[APOLLO_STATE_PROP_NAME]
            const prevState = usePrevious(ssrState)

            const client = useMemo(() => {
                // Init apollo client or reuse global existing one
                const apollo = initApollo({ networkOnly: false })

                // Add SSR state in cache on top of existing cache
                if (ssrState && !isEqual(ssrState, prevState)) {
                    addCacheToClient(apollo, ssrState, {
                        overrideClient: true,
                        broadcast: true,
                    })

                    // If async cache is initialized at this point -> save it
                    if (cachePersistor) {
                        cachePersistor.persist()
                    }
                }

                return apollo
            }, [cachePersistor, prevState, ssrState])

            useEffectOnce(() => {
                async function initPersistor () {
                    const cache = createApolloCache(initCacheConfig(false))
                    const loaderPersistor = createPersistor(cache)

                    // IMPORTANT: Restore client side persisted data before letting the application run any queries
                    await loaderPersistor.restore()

                    // NOTE: At this point we have async filled cache,
                    // but since apollo client is returned in sync useMemo, and we're trying to avoid using loader,
                    // this cache can be out of date, so it must NOT appear on top of clients sync cache, but under it instead

                    addCacheToClient(client, cache.extract(), {
                        broadcast: true,
                        overrideClient: false,
                    })

                    // NOTE: At this point we have restored async cache and current apollo one on top,
                    // and everything is stored in client, so we need another persistor which will point to client

                    const finalPersistor = createPersistor(client.cache)
                    setCachePersistor(finalPersistor)
                }

                initPersistor()
            })

            return { client, cachePersistor }
        }
    }
}
