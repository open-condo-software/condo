import React from 'react';
import Head from 'next/head';
import { ToastProvider } from 'react-toast-notifications';
import { CacheProvider } from '@emotion/core'
// Use only { cache } from 'emotion'. Don't use { css }.
import { cache } from 'emotion'

import { withApollo } from '../lib/apollo';
import { withAuth } from '../lib/auth';
import GlobalStyle from "../containers/GlobalStyle";
import GoogleAnalytics from '../containers/GoogleAnalytics';
import BaseLayout from "../containers/BaseLayout";
import GlobalErrorBoundary from "../containers/GlobalErrorBoundery";

const MyApp = ({ Component, pageProps }) => {
    return (
        <GlobalErrorBoundary>
            <CacheProvider value={cache}>
            <ToastProvider>
                <Head>
                    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
                    <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
                    />
                </Head>
                <GlobalStyle />
                <BaseLayout>
                    <Component {...pageProps} />
                </BaseLayout>
                <GoogleAnalytics />
            </ToastProvider>
            </CacheProvider>
        </GlobalErrorBoundary>
    );
};


export default withApollo({ ssr: true })(withAuth({ ssr: false })(MyApp));
