import React from 'react';
import Head from 'next/head';
import { ToastProvider } from 'react-toast-notifications';

import { withApollo } from '../lib/apollo';
import { withAuth } from '../lib/auth';
// import StylesBase from '../styles/StylesBase';
// import GoogleAnalytics from '../components/GoogleAnalytics';

const MyApp = ({ Component, pageProps }) => {
    return (
        <ToastProvider>
            <Head>
                {/*<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>*/}
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
                />
            </Head>
            {/*<StylesBase />*/}
            <Component {...pageProps} />
            {/*<GoogleAnalytics />*/}
        </ToastProvider>
    );
};


export default withApollo({ ssr: true })(withAuth({ ssr: true })(MyApp));
