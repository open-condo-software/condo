/* eslint-disable */
import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import dayjs from 'dayjs'
// @if OIDC
import { gql } from '@apollo/client'
// @endif
import getConfig from 'next/config'
import Head from 'next/head'
import React from 'react'
import 'dayjs/locale/ru'

import { withApollo } from '@open-condo/next/apollo'
// @if OIDC
import { withAuth } from '@open-condo/next/auth'
// @endif
import { useIntl, withIntl } from '@open-condo/next/intl'

// @if OIDC
import { withOidcAuth } from '~/domains/common/utils/oidcAuth'
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
    dayjs.locale(intl.locale)

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

const resolveBypass = ({ router }) => router.route.includes('/oidc/')

export default (
    withIntl({ ssr: true, messagesImporter, defaultLocale })(
        withApollo({ ssr: true })(
            withAuth({ ssr: true, USER_QUERY })(
                withOidcAuth({ resolveBypass })(MyApp)))))
// @endif

// @if NOT_OIDC
export default (
    withIntl({ ssr: true, messagesImporter, defaultLocale })(
        withApollo({ ssr: true })(MyApp)))
// @endif
