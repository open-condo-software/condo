import { CacheProvider } from '@emotion/core'
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import dayjs from 'dayjs'
import { cache } from 'emotion'
import { gql } from 'graphql-tag'
import Head from 'next/head'
import React from 'react'

import { withApollo } from '@open-condo/next/apollo'
import { withAuth } from '@open-condo/next/auth'
import { useIntl, withIntl } from '@open-condo/next/intl'

import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import { messagesImporter as condoMessageImporter } from '@condo/domains/common/utils/clientSchema/messagesImporter'
import { AppFrameWrapper } from '@condo/domains/miniapp/components/AppFrameWrapper'
import { BaseLayout, LayoutContextProvider } from '@miniapp/domains/common/components/BaseLayout'
import { withOidcAuth } from '@miniapp/domains/common/utils/oidcAuth'
import '@condo/domains/common/components/wdyr'
import '@open-condo/ui/dist/styles.min.css'

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

const MyApp = ({ Component, pageProps }) => {
    const intl = useIntl()
    dayjs.locale(intl.locale)

    const LayoutComponent = Component.container || BaseLayout
    return (
        <AppFrameWrapper>
            <ConfigProvider locale={ANT_LOCALES[intl.locale || 'en']} componentSize='large'>
                <CacheProvider value={cache}>
                    <Head>
                        <link rel='shortcut icon' href='/favicon.ico' type='image/x-icon'/>
                        <meta
                            name='viewport'
                            content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
                        />
                    </Head>
                    <GlobalStyle/>
                    <LayoutContextProvider>
                        <LayoutComponent>
                            <Component {...pageProps} />
                        </LayoutComponent>
                    </LayoutContextProvider>
                </CacheProvider>
            </ConfigProvider>
        </AppFrameWrapper>
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
  organizationId
`

export const USER_QUERY = gql`
    query {
        authenticatedUser {
            ${userFragment}
        }
    }
`

const customAuthMutations = {
    USER_QUERY,
}

// export default (
//     withApollo({ ssr: true })(
//         withIntl({ ssr: true, messagesImporter })(
//             withAuth({ ssr: true, USER_QUERY })(MyApp))))

export default (
    withApollo({ ssr: true })(
        withIntl({ ssr: true, messagesImporter })(
            withAuth({ ssr: true, ...customAuthMutations })( // Auth is mandatory to detection is oauth needed or not
                withOidcAuth()(
                    MyApp,
                ),
            ),
        ),
    )
)
