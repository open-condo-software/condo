[npm-badge-link]: https://img.shields.io/npm/v/@open-condo/apollo?style=flat-square
[npm-pkg-link]: https://www.npmjs.com/package/@open-condo/apollo

# `@open-condo/apollo` [![NPM][npm-badge-link]][npm-pkg-link]
> A wrapper over `@apollo/client` that allows you to use persistent cache from local storage,
> configure TTL, invalidate cache, and use a single configuration for getServerSideProps, SSR, and CSR.

## Table of contents
- [Installation](#installation)
    - [Peer dependencies](#peer-dependencies)
    - [Installing packages](#installing-packages)
        - [NPM](#install-all-npm)
        - [Yarn](#install-all-yarn)
- [Usage](#usage)
    - [Basic setup](#basic-setup)
        1. [Init utils](#init-utils)
        2. [Init apollo client in your _app.tsx](#init-apollo-client-in-your-pages_apptsx)
        3. [Client usage](#client-usage)
        4. [SSR usage](#ssr-usage)
    - [List pagination helpers](#list-pagination-helpers)
    - [Dynamic API uri](#dynamic-api-uri)
    - [Middlewares](#middlewares)
    - [Cache invalidation](#cache-invalidation)
    - [Cache identity](#cache-identity)

## Installation

### Peer dependencies
> **NOTE**: This package uses `react` / `react-dom` and `@apollo/client` as its peer dependencies,
> so make sure you've got ones installed.
>
> You should have no trouble with any react version having a hooks,
> but we're testing on versions `>=16`.
>
> Any apollo `3.x.x` should be fine too, but all utils are tested on `^3.11.8`

### Installing packages

#### Install all (NPM)
```bash
npm i @open-condo/apollo react react-dom @apollo/client
```

#### Install all (Yarn)
```bash
yarn add @open-condo/apollo react react-dom  @apollo/client
```

## Usage

### Basic setup

#### Init utils

To start using `@open-condo/apollo` in your application, you must first configure `ApolloHelper`
and generate the necessary utilities. To do this, paste the following code somewhere in your application:

```typescript
// ./lib/apollo.ts

import { ApolloHelper } from '@open-condo/apollo'
import type { InitCacheConfig, InitializeApollo, UseApollo } from '@open-condo/apollo'
import type { NormalizedCacheObject, ApolloClient } from '@apollo/client'

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'

const cacheConfig: InitCacheConfig = () => {
    return {
        invalidationPolicies: {
            timeToLive: 15 * 60 * 1000, // 15 minutes in milliseconds
        },
    }
}

const apolloHelper = new ApolloHelper({
    uri: `${serverUrl}/api/graphql`,
    cacheConfig,
})

export const initializeApollo: InitializeApollo<ApolloClient<NormalizedCacheObject>> = apolloHelper.initializeApollo
export const useApollo: UseApollo<ApolloClient<NormalizedCacheObject>> = apolloHelper.generateUseApolloHook()
```

#### Init apollo client in your `pages/_app.tsx`:

Then, simply use generated `useApollo` hook to obtain `client` and `cachePersistor`,
which you can pass to your apps child components via standard `ApolloProvider`:

```typescript jsx
import { ApolloProvider } from '@apollo/client'

import { CachePersistorContext } from '@open-condo/apollo'

import type { AppProps } from 'next/app'
import type { ReactNode } from 'react'

import { useApollo } from '@/lib/apollo'

export default function App ({ Component, pageProps, router }: AppProps): ReactNode {
    const { client, cachePersistor } = useApollo(pageProps)

    return (
        <ApolloProvider client={client}>
            <CachePersistorContext.Provider value={{ persistor: cachePersistor }}>
                <Component {...pageProps} />
            </CachePersistorContext.Provider>
        </ApolloProvider>
    )
}
```

After that, you can use any Apollo functions / hooks / utilities as you did before! 🥳

#### Client usage

Nothing additional is required to use Apollo in client components.
cachePersistor can be obtained from the provided `useCachePersistor` hook
to avoid requests while the cache is being loaded.

```typescript jsx
import React from 'react'

import { useQuery } from '@apollo/client'
import { useCachePersistor } from '@open-condo/apollo'

const MyComponent: React.FC = () => {
    const { persistor } = useCachePersistor()
    const { data, loading } = useQuery({
        query: ...,
        variables: {},
        skip: !persistor,
    })
    // ...
}
```

#### SSR usage

To use apollo in SSR environment, use generated `initializeApollo` to obtain fresh client
and `extractApolloState` to pass prefetched data to the client:

```typescript
import React from 'react'
import { extractApolloState } from '@open-condo/apollo'
import { prepareSSRContext } from '@open-condo/miniapp-utils/helpers/apollo'

import { initializeApollo } from '@/lib/apollo'

import type { GetServerSideProps } from 'next'

const MyPage: React.FC = () => {
    return null
}

export default MyPage

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    // NOTE: You should implement this function yourself depending on your business logic, 
    // Common pattern is to extract cookies to "cookie" header, or create Authorization header and so on
    const { headers } = prepareSSRContext(req, res)

    // Init new apollo with initial headers, which will be sent with each request
    const client = initializeApollo({ headers })

    await client.query({ ... })

    // Extract fetched data to pageProps
    return extractApolloState(client, {
        props: { ... }
    })
}
```

### List pagination helpers

`@open-condo/apollo` also provides a set of utilities to make it easier for you to work with list pagination.
To use them, initialise the `ListHelper` class in your `cacheConfig` like so:

```typescript
// ./lib/apollo.ts

import { ApolloHelper } from '@open-condo/apollo'
import type { InitCacheConfig, InitializeApollo, UseApollo } from '@open-condo/apollo'
import type { NormalizedCacheObject, ApolloClient } from '@apollo/client'

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'

const cacheConfig: InitCacheConfig = (cacheOptions) => {
    // Default helper, use skip / first as pagination arguments
    const listHelper = new ListHelper({ cacheOptions })

    // You can override pagination args like so
    const customListHelper = new ListHelper({ cacheOptions, skipArgName: 'offset', firstArgName: 'limit' })

    return {
        typePolicies: {
            Query: {
                fields: {
                    allMeters: {
                        keyArgs: ['where'],
                        merge: listHelper.mergeLists,
                        read: listHelper.getReadFunction('paginate'),
                    },
                    allResidents: {
                        keyArgs: ['where'],
                        merge: listHelper.mergeLists,
                        read: listHelper.getReadFunction('showAll'),
                    },
                    customQuery: {
                        keyArgs: ['where'],
                        merge: customListHelper.mergeLists,
                        read: customListHelper.getReadFunction('paginate'),
                    }
                },
            },
        },
        invalidationPolicies: {
            timeToLive: 15 * 60 * 1000, // 15 minutes in milliseconds
        },
    }
}

const apolloHelper = new ApolloHelper({
    uri: `${serverUrl}/api/graphql`,
    cacheConfig,
})

export const initializeApollo: InitializeApollo<ApolloClient<NormalizedCacheObject>> = apolloHelper.initializeApollo
export const useApollo: UseApollo<ApolloClient<NormalizedCacheObject>> = apolloHelper.generateUseApolloHook()
```

### Dynamic API uri

`ApolloHelper` can accept a function as `uri`. This function is called when the client is initialised
(via initializeApollo or useApollo)

```typescript
// ./lib/apollo.ts

import getConfig from 'next/config'

import { ApolloHelper } from '@open-condo/apollo'
import type { InitializeApollo, UseApollo } from '@open-condo/apollo'
import type { NormalizedCacheObject, ApolloClient } from '@apollo/client'

const { publicRuntimeConfig: { serviceUrl } } = getConfig()

/**
 * Gets API url.
 * If it's in SSR / production the absolute url is used
 * In dev mode relative url is allowed on a client,
 * so you can debug app on another device sharing the same network
 */
function getApiUrl () {
    if (isDebug() && !isSSR()) {
        return '/api/graphql'
    }

    return `${serviceUrl}/api/graphql`
}

const apolloHelper = new ApolloHelper({
    uri: getApiUrl,
})

export const initializeApollo: InitializeApollo<ApolloClient<NormalizedCacheObject>> = apolloHelper.initializeApollo
export const useApollo: UseApollo<ApolloClient<NormalizedCacheObject>> = apolloHelper.generateUseApolloHook()
```

### Middlewares

`ApolloHelper` can accept a set of middlewares representing an `ApolloLink | RequestHandler` type from `@apollo/client`,
from which a common link is subsequently assembled using the `from` utility from `@apollo/client`.

This can be useful if your logic requires additional processing of all requests (headers / error handling, etc. etc.).
You can see more details [here](https://www.apollographql.com/docs/react/networking/advanced-http-networking/#customizing-request-logic)

```typescript
// ./lib/apollo.ts

import getConfig from 'next/config'

import { ApolloHelper } from '@open-condo/apollo'
import type { InitializeApollo, UseApollo } from '@open-condo/apollo'
import type { NormalizedCacheObject, ApolloClient } from '@apollo/client'

const { publicRuntimeConfig: { serviceUrl, revision } } = getConfig()

const apolloHelper = new ApolloHelper({
    uri: `${serviceUrl}/api/graphql`,
    middlewares: [
        getTracingMiddleware({
            serviceUrl,
            codeVersion: revision,
        }),
    ],
})

export const initializeApollo: InitializeApollo<ApolloClient<NormalizedCacheObject>> = apolloHelper.initializeApollo
export const useApollo: UseApollo<ApolloClient<NormalizedCacheObject>> = apolloHelper.generateUseApolloHook()
```

### Cache invalidation

Cache from `@open-condo/apollo` are extended from
[@nerdwallet/apollo-cache-policies](https://github.com/NerdWalletOSS/apollo-cache-policies),
so you can freely explore and use their TTL mechanism.

```typescript
const cacheConfig: InitCacheConfig = (cacheOptions) => {
    const listHelper = new ListHelper({ cacheOptions })

    return {
        typePolicies: {
            Query: {
                fields: {
                    allMeters: {
                        keyArgs: ['where'],
                        merge: listHelper.mergeLists,
                        read: listHelper.getReadFunction('paginate'),
                    },
                    allResidents: {
                        keyArgs: ['where'],
                        merge: listHelper.mergeLists,
                        read: listHelper.getReadFunction('showAll'),
                    },
                    allServiceConsumers: {
                        keyArgs: ['where'],
                        merge: listHelper.mergeLists,
                        read: listHelper.getReadFunction('showAll'),
                    },
                },
            },
        },
        invalidationPolicies: {
            timeToLive: 15 * 60 * 1000, // 15 minutes in milliseconds,
            types: {
                Contact: {
                    timeToLive: 2 * 60 * 60 * 1000, // 2 hours in milliseconds,
                },
            },
        },
    }
}
```

### Cache identity

`@open-condo/apollo` also provides a cache identification mechanism.
It allows not loading cache from `localStorage` if its identity does not match the current clients cache
(obtained from SSR / CSR). By default, all caches are compared at the following path:
```typescript
const DEFAULT_IDENTITY_PATH = ['ROOT_QUERY', 'authenticatedUser', '__ref']
```

To override it - pass the `cacheIdentityKey` parameter to the cache configuration:
```typescript
const cacheConfig: InitCacheConfig = (cacheOptions) => {
    const listHelper = new ListHelper({ cacheOptions })

    return {
        cacheIdentityKey: ['ROOT_QUERY', 'me', 'id'],
    }
}
```
