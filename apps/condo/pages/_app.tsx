// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import Head from 'next/head'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import { ThunderboltFilled, HomeFilled, HeartFilled, PieChartFilled } from '@ant-design/icons'

import whyDidYouRender from '@welldone-software/why-did-you-render'

import { withApollo } from '@core/next/apollo'
import { withAuth } from '@core/next/auth'
import { withIntl } from '@core/next/intl'
import { useOrganization, withOrganization } from '@core/next/organization'

import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import GoogleAnalytics from '@condo/domains/common/components/containers/GoogleAnalytics'
import BaseLayout from '@condo/domains/common/components/containers/BaseLayout'
import GlobalErrorBoundary from '@condo/domains/common/components/containers/GlobalErrorBoundery'

import { GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY } from '@condo/domains/organization/gql'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    whyDidYouRender(React, {
        logOnDifferentValues: true,
    })
}

function menuDataRender () {
    return [
        {
            path: '/',
            icon: PieChartFilled,
            locale: 'menu.Analytics',
        },
        {
            path: '/ticket',
            icon: ThunderboltFilled,
            locale: 'menu.ControlRoom',
        },
        {
            path: '/property',
            icon: HomeFilled,
            locale: 'menu.Property',
        },
        {
            path: '/employee',
            icon: HeartFilled,
            locale: 'menu.Users',
        },
    ]
}

const MyApp = ({ Component, pageProps }) => {
    const LayoutComponent = Component.container || BaseLayout
    // TODO(Dimitreee): remove this mess later
    const HeaderAction = Component.headerAction

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
                <LayoutComponent menuDataRender={menuDataRender} headerAction={HeaderAction}>
                    <Component {...pageProps} />
                </LayoutComponent>
                <GoogleAnalytics/>
            </CacheProvider>
        </GlobalErrorBoundary>
    )
}

async function messagesImporter (locale) {
    const locale_data = await import(`../lang/${locale}`)
    return { ...locale_data.default }
}

export default (
    withApollo({ ssr: true })(
        withIntl({ ssr: true, messagesImporter })(
            withAuth({ ssr: true })(
                withOrganization({
                    ssr: true,
                    GET_ORGANIZATION_TO_USER_LINK_BY_ID_QUERY: GET_ORGANIZATION_EMPLOYEE_BY_ID_QUERY,
                })(
                    MyApp)))))
