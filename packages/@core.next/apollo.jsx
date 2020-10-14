import React from 'react'
import Head from 'next/head'
import {
    ApolloClient,
    ApolloProvider,
    InMemoryCache,
    useApolloClient,
    useLazyQuery,
    useMutation,
    useQuery,
    useSubscription,
} from '@apollo/client'
import fetch from 'isomorphic-unfetch'
import getConfig from 'next/config'
import { createUploadLink } from 'apollo-upload-client'

const { DEBUG_RERENDERS, DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER, preventInfinityLoop, getContextIndependentWrappedInitialProps } = require('./_utils')

let getApolloClientConfig = () => {
    const {
        publicRuntimeConfig: { serverUrl, apolloGraphQLUrl },
    } = getConfig()
    if (!serverUrl || !apolloGraphQLUrl) throw new Error('You should set next.js publicRuntimeConfig { serverUrl, apolloGraphQLUrl } variables. Check your next.config.js')
    return { serverUrl, apolloGraphQLUrl }
}

let createApolloClient = (initialState, ctx) => {
    const { serverUrl, apolloGraphQLUrl } = getApolloClientConfig()
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

    // The `ctx` (NextPageContext) will only be present on the server.
    // use it to extract auth headers (ctx.req) or similar.
    return new ApolloClient({
        // connectToDevTools: !Boolean(ctx),
        ssrMode: Boolean(ctx),
        link: createUploadLink({
            uri: apolloGraphQLUrl, // Server URL (must be absolute)
            credentials: 'same-origin', // Additional fetch() options like `credentials` or `headers`
            fetch: (isOnClientSide && window.fetch) ? window.fetch : fetch,
            headers: (ctx && ctx.req) ? ctx.req.headers : undefined,  // allow to use client cookies on server side requests
        }),
        cache: new InMemoryCache().restore(initialState || {}),
    })
}

// On the client, we store the Apollo Client in the following variable.
// This prevents the client from reinitializing between page transitions.
let globalApolloClient = null

/**
 * Always creates a new apollo client on the server
 * Creates or reuses apollo client in the browser.
 * @param  {NormalizedCacheObject} initialState
 * @param  {NextPageContext} ctx
 */
const initApolloClient = (initialState, ctx) => {
    // Make sure to create a new client for every server-side request so that data
    // isn't shared between connections (which would be bad)
    // It's isOnServerSide === false for expo APP
    const isOnServerSide = typeof window === 'undefined'
    if (isOnServerSide) {
        return createApolloClient(initialState, ctx)
    }

    // Reuse client on the client-side
    if (!globalApolloClient) {
        globalApolloClient = createApolloClient(initialState, ctx)
    }

    return globalApolloClient
}

/**
 * Installs the Apollo Client on NextPageContext
 * or NextAppContext. Useful if you want to use apolloClient
 * inside getStaticProps, getStaticPaths or getServerSideProps
 * @param {NextPageContext | NextAppContext} ctx
 */
const initOnRestore = async (ctx) => {
    const inAppContext = Boolean(ctx.ctx)

    // Initialize ApolloClient if not already done
    const apolloClient =
        ctx.apolloClient ||
        initApolloClient(ctx.apolloState || {}, inAppContext ? ctx.ctx : ctx)

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

/**
 * Creates a withApollo HOC
 * that provides the apolloContext
 * to a next.js Page or AppTree.
 * @param  {Object} withApolloOptions
 * @param  {Boolean} [withApolloOptions.ssr=false]
 * @returns {(PageComponent: ReactNode) => ReactNode}
 */
const withApollo = ({ ssr = false, ...opts } = {}) => PageComponent => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    getApolloClientConfig = opts.getApolloClientConfig ? opts.getApolloClientConfig : getApolloClientConfig
    createApolloClient = opts.createApolloClient ? opts.createApolloClient : createApolloClient

    const WithApollo = ({ apolloClient, apolloState, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithApollo()', apolloState)
        let client
        if (apolloClient) {
            // Happens on: getDataFromTree && next.js ssr
            client = apolloClient
        } else {
            // Happens on: next.js csr || expo
            client = initApolloClient(apolloState, undefined)
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

    if (ssr || PageComponent.getInitialProps) {
        WithApollo.getInitialProps = async ctx => {
            if (DEBUG_RERENDERS) console.log('WithApollo.getInitialProps()', ctx)
            const isOnServerSide = typeof window === 'undefined'
            const { apolloClient } = await initOnRestore(ctx)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            if (isOnServerSide) {
                const { AppTree } = ctx
                // When redirecting, the response is finished.
                // No point in continuing to render
                if (ctx.res && ctx.res.finished) {
                    return pageProps
                }

                // Only if dataFromTree is enabled
                if (ssr && AppTree) {
                    const inAppContext = Boolean(ctx.ctx)
                    try {
                        // Import `@apollo/react-ssr` dynamically.
                        // We don't want to have this in our client bundle.
                        const { getDataFromTree } = await import('@apollo/client/react/ssr')

                        // Since AppComponents and PageComponents have different context types
                        // we need to modify their props a little.
                        let props
                        if (inAppContext) {
                            props = { ...pageProps, apolloClient }
                        } else {
                            props = { pageProps: { ...pageProps, apolloClient } }
                        }

                        // Take the Next.js AppTree, determine which queries are needed to render,
                        // and fetch them. This method can be pretty slow since it renders
                        // your entire AppTree once for every query. Check out apollo fragments
                        // if you want to reduce the number of rerenders.
                        // https://www.apollographql.com/docs/react/data/fragments/
                        await getDataFromTree(<AppTree {...props} />)
                    } catch (error) {
                        // Prevent Apollo Client GraphQL errors from crashing SSR.
                        // Handle them in components via the data.error prop:
                        // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
                        console.error('Error while running `getDataFromTree`', error)
                    }

                    // getDataFromTree does not call componentWillUnmount
                    // head side effect therefore need to be cleared manually
                    Head.rewind()
                }

                preventInfinityLoop(ctx)
            }

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

export {
    withApollo,
    useApolloClient, useMutation, useQuery, useSubscription, useLazyQuery,
}
