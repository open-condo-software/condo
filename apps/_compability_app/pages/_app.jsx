import "antd/dist/antd.css";
import React from 'react'
import Head from 'next/head'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import { flatten } from '../util'
import { withApollo } from '@core/next/apollo'
import { withAuth } from '@core/next/auth'
import { withIntl } from '@core/next/intl'
import { BaseLayout, GlobalErrorBoundary } from '../common/containers'

const MyApp = ({ Component, pageProps }) => {
    const LayoutComponent = Component.container || BaseLayout;

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
};

function messagesImporter(locale) {
    return import(`../lang/${locale}.json`).then(data => flatten(data.default))
}

function getApolloClientConfig() {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    const apolloGraphQLUrl = `${serverUrl}/admin/api`;

    return {
        serverUrl,
        apolloGraphQLUrl
    }
}

export default withApollo({ ssr: true, getApolloClientConfig })(withIntl({ ssr: true, messagesImporter })(withAuth({ ssr: false })(MyApp)))
