import React from 'react'
import Head from 'next/head'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import { DashboardOutlined } from '@ant-design/icons'
import whyDidYouRender from '@welldone-software/why-did-you-render'

import { withApollo } from '@core/next/apollo'
import { withAuth } from '@core/next/auth'
import { withIntl } from '@core/next/intl'
import { withOrganization } from '@core/next/organization'

import GlobalStyle from '@app/condo/containers/GlobalStyle'
import BaseLayout from '@app/condo/containers/BaseLayout'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    whyDidYouRender(React, {
        logOnDifferentValues: true,
    })
}

function menuDataRender () {
    return [
        {
            path: '/',
            icon: <DashboardOutlined/>,
            locale: 'menu.Home',
        },
    ]
}

const MyApp = ({ Component, pageProps }) => {
    const LayoutComponent = Component.container || BaseLayout
    return (
        <CacheProvider value={cache}>
            <Head>
                <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"/>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
                />
            </Head>
            <GlobalStyle/>
            <LayoutComponent menuDataRender={menuDataRender}>
                <Component {...pageProps} />
            </LayoutComponent>
        </CacheProvider>
    )
}

async function messagesImporter (locale) {
    const base = await import(`../../condo/lang/${locale}`)
    const override = await import(`../lang/${locale}`)
    return { ...base.default, ...override.default }
}

export default (
    withApollo({ ssr: true })(
        withIntl({ ssr: true, messagesImporter })(
            withAuth({ ssr: true })(
                withOrganization({ ssr: true })(
                    MyApp)))))
