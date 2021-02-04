import React from 'react'
import Head from 'next/head'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import { DashboardOutlined, UserOutlined } from '@ant-design/icons'
import whyDidYouRender from '@welldone-software/why-did-you-render'

import { withApollo } from '@core/next/apollo'
import { withAuth } from '@core/next/auth'
import { withIntl } from '@core/next/intl'
import { useOrganization, withOrganization } from '@core/next/organization'

import GlobalStyle from '@app/ex02front/containers/GlobalStyle'
import GoogleAnalytics from '@app/ex02front/containers/GoogleAnalytics'
import BaseLayout from '@app/ex02front/containers/BaseLayout'
import GlobalErrorBoundary from '@app/ex02front/containers/GlobalErrorBoundery'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    whyDidYouRender(React, {
        logOnDifferentValues: true,
    })
}

function menuDataRender () {
    const org = useOrganization()
    if (org && org.link && org.link.role === 'owner') {
        return [
            {
                path: '/',
                icon: <DashboardOutlined/>,
                locale: 'menu.Home',
            },
            {
                path: '/users',
                icon: <UserOutlined/>,
                locale: 'menu.Users',
            },
        ]
    } else {
        return [
            {
                path: '/',
                icon: <DashboardOutlined/>,
                locale: 'menu.Home',
            },
        ]
    }
}

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
                <LayoutComponent menuDataRender={menuDataRender}>
                    <Component {...pageProps} />
                </LayoutComponent>
                <GoogleAnalytics/>
            </CacheProvider>
        </GlobalErrorBoundary>
    )
}

async function messagesImporter (locale) {
    const base = await import(`../../_ex02front/lang/${locale}`)
    const override = await import(`../lang/${locale}`)
    return { ...base.default, ...override.default }
}

export default (
    withApollo({ ssr: true })(
        withIntl({ ssr: true, messagesImporter })(
            withAuth({ ssr: true })(
                withOrganization({ ssr: true })(
                    MyApp)))))
