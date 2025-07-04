import {
    ApolloClient,
    ApolloProvider,
    InMemoryCache,
    useApolloClient,
    useLazyQuery,
    useQuery,
    useSubscription,
    ApolloLink,
    NormalizedCacheObject,
    InMemoryCacheConfig,
} from '@apollo/client'
import { ApolloClientOptions } from '@apollo/client/core/ApolloClient'
import { BatchHttpLink } from '@apollo/client/link/batch-http'
import { createUploadLink } from 'apollo-upload-client'
import fetch from 'isomorphic-unfetch'
import get from 'lodash/get'
import { NextPage, NextPageContext } from 'next'
import getConfig from 'next/config'
import React from 'react'

import {
    ApolloHelper,
    CachePersistorContext,
    InitializeApollo,
    UseApollo,
    ApolloHelperOptions,
} from '@open-condo/apollo'
import { isSSR, prepareSSRContext } from '@open-condo/miniapp-utils'

import {
    _useEmitterMutation,
    MutationEmitter,
    MUTATION_RESULT_EVENT,
} from './_useEmitterMutation'
import { DEBUG_RERENDERS, DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER, preventInfinityLoop, getContextIndependentWrappedInitialProps } from './_utils'
import { Either } from './types'


type GetApolloClientConfig = () => { serverUrl, apolloGraphQLUrl, apolloBatchingEnabled }
type CreateApolloClient = (
    initialState: NormalizedCacheObject,
    ctx: NextPageContext,
    apolloCacheConfig?: InMemoryCacheConfig,
    apolloClientConfig?: Partial<ApolloClientOptions<NormalizedCacheObject>>
) => ApolloClient<NormalizedCacheObject>
type InitApolloClient = CreateApolloClient
type InitOnRestore = (
    ctx: NextPageContext | any,
    apolloCacheConfig: InMemoryCacheConfig,
) => Promise<{ apolloClient }>

let getApolloClientConfig: GetApolloClientConfig = () => {
    const {
        publicRuntimeConfig: { serverUrl, apolloGraphQLUrl, apolloBatchingEnabled },
    } = getConfig()
    if (!serverUrl || !apolloGraphQLUrl) throw new Error('You should set next.js publicRuntimeConfig { serverUrl, apolloGraphQLUrl } variables. Check your next.config.js')
    return { serverUrl, apolloGraphQLUrl, apolloBatchingEnabled }
}

let createApolloClient: CreateApolloClient = (initialState, ctx, apolloCacheConfig, apolloClientConfig) => {
    const { serverUrl, apolloGraphQLUrl, apolloBatchingEnabled } = getApolloClientConfig()
    if (DEBUG_RERENDERS) console.log('WithApollo(): getApolloClientConfig()', { serverUrl, apolloGraphQLUrl })

    // Note: isOnClientSide === true for browser and expo
    const isOnClientSide = typeof window !== 'undefined'
    if (isOnClientSide && window.location && window.location.href) {
        // Note: window.location === undefined on expo
        if (!window.location.href.startsWith(serverUrl)) {
            // If location is on a another domain: you can open 127.0.0.1 instead of localhost.
            console.warn(`Your serverUrl=${serverUrl}! Your window.location have another domain! `)
        }
    }

    const isObject = node => typeof node === 'object' && node !== null
    const isFile = input => isOnClientSide && input instanceof File
    const isBlob = input => isOnClientSide && input instanceof Blob

    const hasFiles = (data) => {
        let i = 0
        let found
        const keys = Object.keys(data)

        while (!found && i < keys.length) {
            if (!isObject(data[keys[i]])) {
                i++
            } else if (isFile(data[keys[i]]) || isBlob(data[keys[i]])) {
                found = true
            } else if (hasFiles(data[keys[i]])) {
                found = true
            } else {
                i++
            }
        }

        return found
    }

    const { serverRuntimeConfig } = getConfig()
    const isOnServerSide = typeof window === 'undefined'
    const headers = (ctx && ctx.req) ? ctx.req.headers as Record<string, string> : undefined
    if (isOnServerSide && 'via' in headers) {
        headers['via'] = serverRuntimeConfig?.overridedViaHeader || 'Next'
    }

    const linkPayload = {
        uri: apolloGraphQLUrl, // Server URL (must be absolute)
        credentials: 'include',
        fetchOptions: {
            mode: 'cors',
        },
        fetch: (isOnClientSide && window.fetch) ? window.fetch : fetch,
        headers, // allow to use client cookies on server side requests
    }

    const uploadLink = createUploadLink(linkPayload)
    const batchLink = new BatchHttpLink({
        ...linkPayload,
        batchMax: 50,
        batchInterval: 10,
    })


    const apolloLink = apolloBatchingEnabled
        // NOTE: same package in different locations type mismatch
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ? ApolloLink.split(operation => hasFiles(get(operation, 'variables', {})), uploadLink, batchLink)
        : uploadLink

    // The `ctx` (NextPageContext) will only be present on the server.
    // use it to extract auth headers (ctx.req) or similar.
    return new ApolloClient({
        // connectToDevTools: !Boolean(ctx),
        ssrMode: Boolean(ctx),
        // NOTE: same package in different locations type mismatch
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        link: apolloLink,
        cache: new InMemoryCache(apolloCacheConfig).restore(initialState || {}),
        ...apolloClientConfig,
    })
}

// On the client, we store the Apollo Client in the following variable.
// This prevents the client from reinitializing between page transitions.
let globalApolloClient = null

/**
 * Always creates a new apollo client on the server
 * Creates or reuses apollo client in the browser.
 * @param {NormalizedCacheObject} initialState
 * @param {NextPageContext} ctx
 * @param {InMemoryCacheConfig} apolloCacheConfig
 * @param {ApolloClientOptions} apolloClientConfig
 */
const initApolloClient: InitApolloClient = (initialState, ctx, apolloCacheConfig, apolloClientConfig) => {
    // Make sure to create a new client for every server-side request so that data
    // isn't shared between connections (which would be bad)
    // It's isOnServerSide === false for expo APP
    const isOnServerSide = typeof window === 'undefined'
    if (isOnServerSide) {
        return createApolloClient(initialState, ctx, apolloCacheConfig, apolloClientConfig)
    }

    // Reuse client on the client-side
    if (!globalApolloClient) {
        globalApolloClient = createApolloClient(initialState, ctx, apolloCacheConfig, apolloClientConfig)
    }

    return globalApolloClient
}

/**
 * Installs the Apollo Client on NextPageContext
 * or NextAppContext. Useful if you want to use apolloClient
 * inside getStaticProps, getStaticPaths or getServerSideProps
 * @param {NextPageContext | NextAppContext} ctx
 * @param {InMemoryCacheConfig} apolloCacheConfig
 */
const initOnRestore: InitOnRestore = async (ctx, apolloCacheConfig) => {
    const inAppContext = Boolean(ctx.ctx)

    // Initialize ApolloClient if not already done
    const apolloClient =
        ctx.apolloClient ||
        initApolloClient(ctx.apolloState || {}, inAppContext ? ctx.ctx : ctx, apolloCacheConfig)

    // We send the Apollo Client as a prop to the component to avoid calling initApollo() twice in the server.
    // Otherwise, the component would have to call initApollo() again but this
    // time without the context. Once that happens, the following code will make sure we send
    // the prop as `null` to the browser.
    apolloClient.toJSON = () => null

    // Add apolloClient to NextPageContext & NextAppContext.
    // This allows us to consume the apolloClient inside our
    // custom `getInitialProps({ apolloClient })`.
    ctx.apolloClient = apolloClient
    if (inAppContext) {
        ctx.ctx.apolloClient = apolloClient
    }

    return { apolloClient }
}

export type WithApolloLegacyProps = {
    ssr?: boolean
    getApolloClientConfig?: GetApolloClientConfig
    createApolloClient?: CreateApolloClient
    apolloCacheConfig?: InMemoryCacheConfig
    apolloClientConfig?: Partial<ApolloClientOptions<NormalizedCacheObject>>
}
export type WillApolloLegacyType = (props: WithApolloLegacyProps) => (PageComponent: NextPage) => NextPage

/** @deprecated */
const _withApolloLegacy: WillApolloLegacyType = ({ ssr = false, ...opts } = {}) => (PageComponent: NextPage): NextPage => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    getApolloClientConfig = opts.getApolloClientConfig ? opts.getApolloClientConfig : getApolloClientConfig
    createApolloClient = opts.createApolloClient ? opts.createApolloClient : createApolloClient

    const apolloCacheConfig = opts.apolloCacheConfig ? opts.apolloCacheConfig : {}
    const apolloClientConfig = opts.apolloClientConfig ? opts.apolloClientConfig : {}

    const WithApollo = (props) => {
        const { apolloClient, apolloState, ...pageProps } = props
        if (DEBUG_RERENDERS) console.log('WithApollo()', apolloState)
        let client
        if (apolloClient) {
            // Happens on: getDataFromTree && next.js ssr
            client = apolloClient
        } else {
            // Happens on: next.js csr || expo
            client = initApolloClient(apolloState, undefined, apolloCacheConfig, apolloClientConfig)
        }

        return (
            <ApolloProvider client={client}>
                <PageComponent {...pageProps} />
            </ApolloProvider>
        )
    }

    if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) WithApollo.whyDidYouRender = true

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName =
            PageComponent.displayName || PageComponent.name || 'Component'
        WithApollo.displayName = `withApollo(${displayName})`
    }

    if (ssr || !isSSR() || PageComponent.getInitialProps) {
        WithApollo.getInitialProps = async ctx => {
            if (DEBUG_RERENDERS) console.log('WithApollo.getInitialProps()', ctx)
            const { apolloClient } = await initOnRestore(ctx, apolloCacheConfig)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            return {
                ...pageProps,
                // Extract query data from the Apollo store
                apolloState: apolloClient.cache.extract(),
                // Provide the client for ssr. As soon as this payload
                // gets JSON.stringified it will remove itself.
                apolloClient: apolloClient,
            }
        }
    }

    return WithApollo
}

let initializeApollo: InitializeApollo<ApolloClient<NormalizedCacheObject>>

export type WithApolloProps = {
    ssr?: boolean
    apolloHelperOptions: ApolloHelperOptions
}
export type WillApolloType = (props: WithApolloProps) => (PageComponent: NextPage) => NextPage
/**
 * Creates a withApollo HOC
 * that provides the apolloContext
 * to a next.js Page or AppTree.
 */
const _withApollo: WillApolloType = ({ ssr, apolloHelperOptions }) => (PageComponent: NextPage): NextPage => {
    const apolloHelper = new ApolloHelper(apolloHelperOptions)
    const useApollo = apolloHelper.generateUseApolloHook() as unknown as UseApollo<ApolloClient<NormalizedCacheObject>>
    initializeApollo = apolloHelper.initializeApollo as unknown as InitializeApollo<ApolloClient<NormalizedCacheObject>>

    const WithApollo = (props) => {
        const { client, cachePersistor } = useApollo(props)

        return (
            <ApolloProvider client={client}>
                <CachePersistorContext.Provider value={{ persistor: cachePersistor }}>
                    <PageComponent {...props} />
                </CachePersistorContext.Provider>
            </ApolloProvider>
        )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName =
            PageComponent.displayName || PageComponent.name || 'Component'
        WithApollo.displayName = `withApollo(${displayName})`
    }

    if (ssr || !isSSR() || PageComponent.getInitialProps) {
        /**
         * @param context {{AppTree, Component, router, ctx: NextPageContext}}
         */
        WithApollo.getInitialProps = async (context) => {
            let headers, networkOnly
            if (isSSR()) {
                const req = context?.req || context?.ctx?.req
                const res = context?.res || context?.ctx?.res;
                ({ headers } = prepareSSRContext(req, res))
            } else {
                networkOnly = false
            }
            const apolloClient = initializeApollo({ headers, networkOnly })

            if (!context.apolloClient) context.apolloClient = apolloClient
            if (context.ctx && !context.ctx.apolloClient) context.ctx.apolloClient = apolloClient

            let childProps = {}
            if (PageComponent.getInitialProps) {
                childProps = await PageComponent.getInitialProps(context)
            }

            if (isSSR()) {
                preventInfinityLoop(context)
            }

            return {
                ...childProps,
                __APOLLO_STATE__: apolloClient.cache.extract(),
            }
        }
    }

    return WithApollo
}

type mergedWithApolloProps = Either<WithApolloProps & { legacy: false }, WithApolloLegacyProps & { legacy?: true }>
type mergedWithApolloType = (props: mergedWithApolloProps) => (PageComponent: NextPage) => NextPage
const withApollo: mergedWithApolloType = (props) => (PageComponent: NextPage): NextPage => {
    if (props.legacy === false) {
        return _withApollo(props)(PageComponent)
    } else {
        return _withApolloLegacy(props)(PageComponent)
    }
}

const useMutation: typeof _useEmitterMutation = (mutation, options) =>  {
    return _useEmitterMutation(mutation, options)
}

export {
    withApollo,
    useApolloClient,
    useQuery,
    useSubscription,
    useLazyQuery,
    useMutation,
    MutationEmitter,
    MUTATION_RESULT_EVENT,
    initializeApollo,
}
