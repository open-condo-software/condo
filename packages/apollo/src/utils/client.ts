import { ApolloClient, ApolloLink } from '@apollo/client'
import { createUploadLink } from 'apollo-upload-client'

import { isSSR } from '@open-condo/miniapp-utils/helpers/environment'

import { createApolloCache } from './cache'

import { APOLLO_STATE_PROP_NAME } from '../constants'

import type { InvalidationCacheConfig, InitCacheConfig } from './cache'
import type { NormalizedCacheObject } from '@apollo/client'

type InitApolloClientOptions = {
    networkOnly?: boolean
}

type ApolloClientOptions = {
    headers?: Record<string, string>
    cacheConfig?: InvalidationCacheConfig
}

type SSRResult<PropsType> = {
    props: PropsType & {
        [APOLLO_STATE_PROP_NAME]?: NormalizedCacheObject
    }
}

function createApolloClient (options: ApolloClientOptions): ApolloClient<NormalizedCacheObject> {
    return new ApolloClient({
        ssrMode: isSSR(),
        link: createUploadLink({
            uri: '123', // TODO: ADD URI
            headers: options.headers,
            credentials: 'include',
            fetchOptions: {
                mode: 'cors',
            },
        }) as unknown as ApolloLink,
        cache: createApolloCache(options.cacheConfig),
    })
}

function extractApolloState<PropsType> (
    client: ApolloClient<NormalizedCacheObject>,
    pageParams: SSRResult<PropsType>
): SSRResult<PropsType> {
    if (pageParams?.props) {
        pageParams.props[APOLLO_STATE_PROP_NAME] = client.cache.extract()
    }

    return pageParams
}

class ApolloUtilsProvider {
    private readonly _config: InitCacheConfig | undefined
    private _apolloClient: ApolloClient<NormalizedCacheObject> | undefined

    constructor (config: InitCacheConfig) {
        this._config = config
    }

    initializeApollo (options?: InitApolloClientOptions) {
        const cacheOptions:
    }
}
