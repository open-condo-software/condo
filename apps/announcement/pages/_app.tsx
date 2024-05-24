import { CacheProvider } from '@emotion/core'
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import dayjs from 'dayjs'
import { cache } from 'emotion'
import { gql } from 'graphql-tag'
import get from 'lodash/get'
import getConfig from 'next/config'
import Head from 'next/head'
import React, { useContext, useEffect } from 'react'

import { withApollo } from '@open-condo/next/apollo'
import { withAuth } from '@open-condo/next/auth'
import { withIntl, useIntl, LocaleContext } from '@open-condo/next/intl'

import {
    BaseLayout,
    LayoutContextProvider,
} from '@announcement/domains/common/components/containers/BaseLayout'
import { withOidcAuth } from '@announcement/domains/common/utils/oidcAuth'
import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'
import { messagesImporter as condoMessageImporter } from '@condo/domains/common/utils/clientSchema/messagesImporter'
import { AppFrameWrapper } from '@condo/domains/miniapp/components/AppFrameWrapper'
import { useLaunchParams } from '@condo/domains/miniapp/hooks/useLaunchParams'

import '@condo/domains/common/components/wdyr'
import '@open-condo/ui/dist/styles.min.css'


const {
    publicRuntimeConfig: {
        defaultLocale,
    },
} = getConfig()

interface ILocaleContext {
    setLocale: (lang: string) => void
    locale: string
}

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}
const ANT_DEFAULT_LOCALE = ruRU

const useCondoLocale = () => {
    const localeContext = useContext<ILocaleContext>(LocaleContext)
    const { context: launchContext, loading: launchContextLoading } = useLaunchParams()

    useEffect(() => {
        if (launchContextLoading) return
        if (!localeContext || !launchContext) return

        const locale = get(launchContext, 'condoLocale', defaultLocale)
        localeContext.setLocale(locale)
    }, [launchContextLoading])
}

const MyApp = ({ Component, pageProps }) => {
    const intl = useIntl()

    useCondoLocale()
    dayjs.locale(intl.locale)

    const LayoutComponent = Component.container || BaseLayout
    const RequiredAccess = Component.requiredAccess || React.Fragment

    return (
        <>
            <Head>
                <link rel='shortcut icon' href='/favicon.ico' type='image/x-icon'/>
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
                />
            </Head>
            <GlobalStyle/>
            <AppFrameWrapper>
                <LayoutContextProvider>
                    <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE} componentSize='large'>
                        <CacheProvider value={cache}>
                            <LayoutComponent>
                                <RequiredAccess>
                                    <Component {...pageProps} />
                                </RequiredAccess>
                            </LayoutComponent>
                        </CacheProvider>
                    </ConfigProvider>
                </LayoutContextProvider>
            </AppFrameWrapper>
        </>
    )
}

async function messagesImporter (locale) {
    const base = await condoMessageImporter(locale)
    const override = await import(`@app/announcement/lang/${locale}/${locale}`)
    return { ...base, ...override.default }
}


const userFragment = `
  id
  name
  isAdmin
  isSupport
  email
  type
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

// Function to skip some HOC restrictions
const resolveBypass = ({ router }) => {
    // We do not need any condo information here
    return router.route.includes('/grant-storage-access/')
}

export default (
    withApollo({ ssr: true })(
        withIntl({ ssr: true, messagesImporter })(
            withAuth({ ssr: true, ...customAuthMutations })(
                withOidcAuth({ resolveBypass })(
                    MyApp
                )
            )
        )
    )
)
