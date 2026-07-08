/* eslint-disable */
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import dayjs from 'dayjs'
import getConfig from 'next/config'
import Head from 'next/head'
// @if OIDC
import { useRouter } from 'next/router'
// @endif
import React from 'react'
import 'dayjs/locale/ru'

import { withApollo } from '@open-condo/next/apollo'
import { useIntl, withIntl } from '@open-condo/next/intl'
// @if OIDC
import { gql } from '@apollo/client'
import { useAuth, withAuth } from '@open-condo/next/auth'
// @endif

import 'antd/dist/antd.compact.css'
import '@open-condo/ui/dist/styles.min.css'
import '@open-condo/ui/dist/style-vars/variables.css'

const { publicRuntimeConfig: { defaultLocale } } = getConfig()

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

const ANT_DEFAULT_LOCALE = enUS

const MyApp = ({ Component, pageProps }) => {
    const intl = useIntl()
    // @if OIDC
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    // @endif
    dayjs.locale(intl.locale)

    // @if OIDC
    React.useEffect(() => {
        if (isLoading || isAuthenticated || Component.allowUnauthorized) return

        const next = encodeURIComponent(router.asPath || '/')
        router.replace(`/auth/signin?next=${next}`)
    }, [Component.allowUnauthorized, isAuthenticated, isLoading, router])

    if (!isLoading && !isAuthenticated && !Component.allowUnauthorized) {
        return null
    }
    // @endif

    return (
        <>
            <Head>
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                />
            </Head>
            <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE} componentSize='large'>
                <main>
                    <Component {...pageProps} />
                </main>
            </ConfigProvider>
        </>
    )
}

async function messagesImporter (locale) {
    const localeData = await import(`../lang/${locale}/${locale}`)
    return { ...localeData.default }
}

// @if OIDC
const userFragment = `
    id
    name
    isAdmin
    isSupport
`

export const USER_QUERY = gql`
    query {
        authenticatedUser {
            ${userFragment}
        }
    }
`
// @endif

// @if OIDC
export default (
    withIntl({ ssr: true, messagesImporter, defaultLocale })(
        withApollo({ ssr: true })(
            withAuth({ ssr: true, USER_QUERY })(MyApp))))
// @endif
// @if NOT_OIDC
export default (
    withIntl({ ssr: true, messagesImporter, defaultLocale })(
        withApollo({ ssr: true })(MyApp)))
// @endif
