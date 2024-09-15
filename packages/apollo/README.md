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
  - [List pagination helpers](#list-pagination-helpers)
  - 

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

#### 1. Init utils

To start using `@open-condo/apollo` in your application, you must first configure `ApolloHelper`
and generate the necessary utilities. To do this, use the following code somewhere in your application:

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

#### 2. Init apollo client in your `pages/_app.tsx`:

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

#### 3. SSR usage

To use apollo in SSR environment, use generate `initializeApollo` to obtain fresh client 
and `extractApolloState` to pass prefetched data to the client:

```typescript
import React from 'react'
import { extractApolloState } from '@open-condo/apollo'

import { initializeApollo } from '@/lib/apollo'

import type { GetServerSideProps } from 'next'

const MyPage: React.FC = () => {
    return null
}

export default MyPage

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    // NOTE: You should implement this function yourself depending on your business logic
    const headers = getRequiredHeader(req, res)
    
    const client = initializeApollo({ headers })
    
    await client.query({ ... })
    
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

### Middlewares

### Cache invalidation

### Cache identity

### Integrations with [`@open-condo/miniapp-utils`](https://www.npmjs.com/package/@open-condo/miniapp-utils)