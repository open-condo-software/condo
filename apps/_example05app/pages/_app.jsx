import React from 'react'
import Head from 'next/head'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'

import { withApollo } from '../lib/apollo'
import { withAuth } from '../lib/auth'
import GlobalStyle from '../containers/GlobalStyle'
import GoogleAnalytics from '../containers/GoogleAnalytics'
import BaseLayout from '../containers/BaseLayout'
import GlobalErrorBoundary from '../containers/GlobalErrorBoundery'

const MyApp = ({ Component, pageProps }) => {
    const LayoutComponent = Component.container || BaseLayout
    return (
        <GlobalErrorBoundary>
            <CacheProvider value={cache}>
                <Head>
                    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
                    />
                </Head>
                <GlobalStyle/>
                <LayoutComponent>
                    <Component {...pageProps} />
                </LayoutComponent>
                <GoogleAnalytics/>
            </CacheProvider>
        </GlobalErrorBoundary>
    )
}

export default withApollo({ ssr: true })(withAuth({ ssr: false })(MyApp))
