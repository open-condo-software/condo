import React from 'react'
import Head from 'next/head'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import { DashboardOutlined } from '@ant-design/icons'

import { withApollo } from '@open-condo/next/apollo'
import { withAuth } from '@open-condo/next/auth'
import { withIntl } from '@open-condo/next/intl'
import { withOrganization } from '@open-condo/next/organization'

import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import BaseLayout from '@app/condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import '@condo/domains/common/components/wdyr'

const MenuData = () => {
    return (
        <MenuItem
            path={'/'}
            icon={DashboardOutlined}
            label={'global.section.analytics'}
        />
    )
}

const MyApp = ({ Component, pageProps }) => {
    const LayoutComponent = Component.container || BaseLayout
    const HeaderAction = Component.headerAction
    const RequiredAccess = Component.requiredAccess || React.Fragment
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
            <LayoutComponent menuData={<MenuData/>} headerAction={HeaderAction}>
                <RequiredAccess>
                    <Component {...pageProps} />
                </RequiredAccess>
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
