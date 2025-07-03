import { CacheProvider } from '@emotion/react'
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
import { LocaleContext, useIntl, withIntl } from '@open-condo/next/intl'

import GlobalStyle from '@condo/domains/common/components/containers/GlobalStyle'

import '@open-condo/ui/dist/styles.min.css'

import { AppFrameWrapper } from '@{{name}}/domains/common/components/AppFrameWrapper'
import { BaseLayout } from '@{{name}}/domains/common/components/containers/BaseLayout'
import { useLaunchParams } from '@{{name}}/domains/common/hooks/useLaunchParams'
import { withOidcAuth } from '@{{name}}/domains/common/utils/oidcAuth'


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
                <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE} componentSize='large'>
                    <CacheProvider value={cache}>
                        <LayoutComponent>
                            <RequiredAccess>
                                <Component {...pageProps} />
                            </RequiredAccess>
                        </LayoutComponent>
                    </CacheProvider>
                </ConfigProvider>
            </AppFrameWrapper>
        </>
    )
}

async function messagesImporter (locale) {
    return await import(`@app/{{name}}/lang/${locale}/${locale}`)
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
    withIntl({ ssr: true, messagesImporter })(
        withApollo({ ssr: true })(
            withAuth({ ssr: true, ...customAuthMutations })(
                withOidcAuth({ resolveBypass })(
                    MyApp
                )
            )
        )
    )
)
