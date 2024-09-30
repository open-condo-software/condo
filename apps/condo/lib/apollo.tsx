import { ApolloClient, ApolloProvider, NormalizedCacheObject, useApolloClient } from '@apollo/client'
import { NextPage } from 'next'
import getConfig from 'next/config'
import React from 'react'

import {
    ApolloHelper, CachePersistorContext,
    InitializeApollo,
    ListHelper,
    UseApollo,
} from '@open-condo/apollo'
import type { InitCacheConfig } from '@open-condo/apollo'
import { getTracingMiddleware } from '@open-condo/miniapp-utils/helpers/apollo'

import { BILLING_RECEIPT_SERVICE_FIELD_NAME } from '@condo/domains/billing/constants/constants'

// TODO(INFRA-517): не работает @open-condo/miniapp-utils/helpers/apollo
export { prepareSSRContext } from '@open-condo/miniapp-utils/src/helpers/apollo'


const { publicRuntimeConfig: { apolloGraphQLUrl, serverUrl } } = getConfig()


function getApiUrl () {
    return apolloGraphQLUrl
}

const cacheConfig: InitCacheConfig = (cacheOptions) => {
    const listHelper = new ListHelper({ cacheOptions })

    return {
        typePolicies: {
            Query: {
                fields: {
                    allContacts: {
                        keyArgs: ['where'],
                        merge: listHelper.mergeLists,
                        read: listHelper.getReadFunction('paginate'),
                    },
                },
            },

            // NOTE: legacy
            //     Configuration for `InMemoryCache` of Apollo
            //     Add fields, related to pagination strategies of Apollo.
            //     Items of some GraphQL global fields needs to be appended to list,
            //     when paginated, rather than to be displayed as a slice of data, —
            //     its like "Infinite scrolling" UI pattern. For example, fetching
            //     more changes of a ticket on button click.
            //     For those items, we need to set `concatPagination` strategy.
            //     https://www.apollographql.com/docs/react/pagination/core-api/
            [BILLING_RECEIPT_SERVICE_FIELD_NAME]: {
                // avoiding of building cache from ID on client, since Service ID is not UUID and will be repeated
                keyFields: false,
            },
            BuildingSection: {
                keyFields: false,
            },
            BuildingFloor: {
                keyFields: false,
            },
            BuildingUnit: {
                keyFields: false,
            },
        },
        invalidationPolicies: {
            timeToLive: 100 * 15 * 60 * 1000, // 15 minutes in milliseconds
        },

    }
}

const apolloHelper = new ApolloHelper({
    uri: getApiUrl,
    cacheConfig,
    // middlewares: [
    //     getTracingMiddleware({
    //         serviceUrl: serverUrl,
    //         target: ,
    //         codeVersion: ,
    //     }),
    // ],
})

// NOTE: Type casting is used for apollo type mismatch
export const initializeApollo = apolloHelper.initializeApollo as unknown as InitializeApollo<ApolloClient<NormalizedCacheObject>>
export const useApollo = apolloHelper.generateUseApolloHook() as unknown as UseApollo<ApolloClient<NormalizedCacheObject>>

export const withApollo = () => (PageComponent: NextPage): NextPage => {
    const WithApollo = (props) => {

        // console.log('::WithApollo:: >>>', {
        //     props,
        // })

        const { client, cachePersistor } = useApollo(props.pageProps)

        // if (!cachePersistor) return null
        // const ssrCookies = useVitalCookies(pageProps)

        return (
            // <SSRCookiesContext.Provider value={ssrCookies}>
            <ApolloProvider client={client}>
                <CachePersistorContext.Provider value={{ persistor: cachePersistor }}>
                    <PageComponent {...props} />
                </CachePersistorContext.Provider>
            </ApolloProvider>
            // </SSRCookiesContext.Provider>
        )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName =
            PageComponent.displayName || PageComponent.name || 'Component'
        WithApollo.displayName = `withApollo(${displayName})`
    }

    WithApollo.getInitialProps = PageComponent.getInitialProps

    return WithApollo
}