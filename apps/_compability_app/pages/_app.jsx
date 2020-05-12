import React from 'react'
import Head from 'next/head'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import "antd/dist/antd.css";

import { withApollo } from '../lib/apollo'
import { withAuth } from '../lib/auth'
import { withIntl } from '../lib/Intl'
import GlobalErrorBoundary from '../containers/GlobalErrorBoundery'
import BaseLayout from '../containers/BaseLayout'

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
                <LayoutComponent>
                    <Component {...pageProps} />
                </LayoutComponent>
            </CacheProvider>
        </GlobalErrorBoundary>
    )
}

export default withApollo({ ssr: true })(withIntl({ ssr: true })(withAuth({ ssr: false })(MyApp)))
