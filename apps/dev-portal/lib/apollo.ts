import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import merge from 'deepmerge'
import isEqual from 'lodash/isEqual'
import getConfig from 'next/config'
import { useMemo } from 'react'

const { publicRuntimeConfig: { apolloGraphQLUrl } } = getConfig()

type PageProps<PropsType> = {
    props: PropsType
}

export const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__'

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined

/**
 * Generates new apolloClient with InMemoryCache.
 * In most cases you should not use this directly
 * @return {ApolloClient<NormalizedCacheObject>}
 */
function createApolloClient (): ApolloClient<NormalizedCacheObject> {
    return new ApolloClient({
        ssrMode: typeof window === 'undefined',
        link: new HttpLink({
            uri: apolloGraphQLUrl,
            credentials: 'same-origin',
            fetchOptions: {
                mode: 'cors',
            },
        }),
        cache: new InMemoryCache(),
    })
}

/**
 * Initialize new apollo client.
 * You should use it in getServerSideProps or getStaticProps
 * to prefetch any page-level queries, so there'll be no loading state on client for them
 * @param {NormalizedCacheObject | null} initialState
 * @return {ApolloClient<NormalizedCacheObject>}
 * @example
 * ```typescript
 * const client = initializeApollo()
 * client.query({ query: AUTH_QUERY })
 * ```
 */
export function initializeApollo (initialState: NormalizedCacheObject | null = null): ApolloClient<NormalizedCacheObject> {
    const _apolloClient = apolloClient ?? createApolloClient()
    if (initialState) {
        const existingCache = _apolloClient.extract()

        const cacheData = merge(initialState, existingCache, {
            arrayMerge: (destinationArray, sourceArray) => [
                ...sourceArray,
                ...destinationArray.filter(destElem =>
                    sourceArray.every(sourceElem => !isEqual(destElem, sourceElem))
                ),
            ],
        })

        _apolloClient.cache.restore(cacheData)
    }

    if (typeof window === 'undefined') {
        return _apolloClient
    }

    if (!apolloClient) {
        apolloClient = _apolloClient
    }

    return _apolloClient
}

/**
 * Extracts apollo state which was generated from queries inside getServerSideProps,
 * and passes it pageProps, so client can restore all prefetched data.
 * @param {ApolloClient<NormalizedCacheObject>} client - apollo client
 * @param {PropsType extends EmptyPageProps} pageProps - pageProps to wrap
 * @return {PropsType extends EmptyPageProps}
 * @example
 * ```typescript
 * export async function getServerSideProps () {
 *     const client = initializeApollo()
 *     await client.query({ query: AUTH_QUERY })
 *     await client.query({ query: ALL_MY_OBJS_QUERY })
 *
 *     return extractApolloState(client, {
 *         props: {
 *             myPageProp: 123
 *         }
 *     })
 * }
 * ```
 */
export function extractApolloState<PropsType> (client: ApolloClient<NormalizedCacheObject>, pageProps?: PageProps<PropsType>): PageProps<PropsType> {
    if (pageProps?.props) {
        pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract()
    }

    return pageProps
}

/**
 * Initialize new apollo client or reuse existing one on client,
 * provides client with a cache from extractApolloState of getServerSideProps
 * @param {PropsType extends EmptyPageProps} pageProps - pageProps received in _app.tsx
 */
export function useApollo<PropsType> (pageProps?: PageProps<PropsType>): ApolloClient<NormalizedCacheObject> {
    const state = pageProps[APOLLO_STATE_PROP_NAME]
    return useMemo(() => initializeApollo(state), [state])
}

export { useQuery, useMutation, useApolloClient } from '@apollo/client'

