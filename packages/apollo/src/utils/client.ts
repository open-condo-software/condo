import { ApolloClient, InMemoryCache } from '@apollo/client'
import { createUploadLink } from 'apollo-upload-client'

import { isSSR } from '@open-condo/miniapp-utils/helpers/environment'

// import type { InvalidationCache } from './cache'
import type { NormalizedCacheObject } from '@apollo/client'

export type ApolloClientOptions = {
    headers?: Record<string, string>
}

export function createApolloClient (options: ApolloClientOptions): ApolloClient<NormalizedCacheObject> {
    return new ApolloClient({
        ssrMode: isSSR(),
        link: createUploadLink({
            uri: '123', // TODO: ADD URI
            headers: options.headers,
            credentials: 'include',
            fetchOptions: {
                mode: 'cors',
            },
        }),
        cache: new InMemoryCache(),
    })
}