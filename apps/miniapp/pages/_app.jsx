import React from 'react'
import Head from 'next/head'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import { ConfigProvider } from 'antd'
import { gql } from 'graphql-tag'
import { CacheProvider } from '@emotion/core'
import { cache } from 'emotion'
import whyDidYouRender from '@welldone-software/why-did-you-render'

import { withApollo } from '@core/next/apollo'
import { withAuth } from '@core/next/auth'
import { useIntl, withIntl } from '@core/next/intl'

import { messagesImporter as condoMessageImporter } from '@condo/domains/common/utils/clientSchema/messagesImporter'

import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import EmptyLayout from '@condo/domains/common/components/containers/EmptyLayout'
import dayjs from 'dayjs'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    whyDidYouRender(React, {
        logOnDifferentValues: true,
    })
}

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

const MyApp = ({ Component, pageProps }) => {
    const intl = useIntl()
    dayjs.locale(intl.locale)

    const LayoutComponent = Component.container || EmptyLayout
    return (
        <ConfigProvider locale={ANT_LOCALES[intl.locale || 'en']} componentSize={'large'}>
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
            </CacheProvider>
        </ConfigProvider>
    )
}

async function messagesImporter (locale) {
    const base = await condoMessageImporter(locale)
    const override = await import(`../lang/${locale}`)
    return { ...base, ...override.default }
}

const userFragment = `
  id
  name
  isAdmin
`

export const USER_QUERY = gql`
    query {
        authenticatedUser {
            ${userFragment}
        }
    }
`

export default (
    withApollo({ ssr: true })(
        withIntl({ ssr: true, messagesImporter })(
            withAuth({ ssr: true, USER_QUERY })(MyApp))))
