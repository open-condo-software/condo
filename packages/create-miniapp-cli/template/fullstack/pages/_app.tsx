import { ConfigProvider } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
import dayjs from 'dayjs'
import { gql } from 'graphql-tag'
import get from 'lodash/get'
import getConfig from 'next/config'
import Head from 'next/head'
import React, { useContext } from 'react'

import { extractReqLocale } from '@open-condo/locales/extractReqLocale'
import { withApollo } from '@open-condo/next/apollo'
import { withAuth } from '@open-condo/next/auth'
import { useIntl, withIntl, LocaleContext } from '@open-condo/next/intl'

import { AppFrameWrapper } from '@billing-connector/domains/common/components/containers/AppFrameWrapper'
import EmptyLayout from '@billing-connector/domains/common/components/containers/EmptyLayout'
import Loader from '@billing-connector/domains/common/components/Loader'
import { useLaunchParams } from '@billing-connector/domains/common/hooks/useLaunchParams'

import '@open-condo/ui/dist/styles.min.css'
import '@app/billing-connector/pages/global.css'

const { publicRuntimeConfig: { defaultLocale } } = getConfig()

interface ILocaleContext {
    setLocale: (lang: string) => void
    locale: string
}

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

const ANT_DEFAULT_LOCALE = enUS

const MyApp = ({ Component, pageProps }) => {
    const localeContext: ILocaleContext = useContext(LocaleContext)
    const { context: launchContext, loading: launchParamsAreLoading } = useLaunchParams()

    const intl = useIntl()
    dayjs.locale(intl.locale)
    const PageTitle = intl.formatMessage({ id: 'integrationName.1S' })

    if (launchParamsAreLoading) {
        return <Loader loading={launchParamsAreLoading} size='large'/>
    }

    const locale = get(launchContext, 'condoLocale', defaultLocale)
    localeContext.setLocale(locale || intl.locale)

    const LayoutComponent = Component.container || EmptyLayout
    const HeaderAction = Component.headerAction
    const RequiredAccess = Component.requiredAccess || React.Fragment

    return (
        <>
            <Head>
                <meta
                    name='viewport'
                    content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                />
                <title>{PageTitle}</title>
            </Head>
            <AppFrameWrapper>
                <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE} componentSize='large'>
                    <LayoutComponent headerAction={HeaderAction}>
                        <RequiredAccess>
                            <main>
                                <Component {...pageProps} />
                            </main>
                        </RequiredAccess>
                    </LayoutComponent>
                </ConfigProvider>
            </AppFrameWrapper>
        </>
    )
}

async function messagesImporter (locale) {
    const locale_data = await import(`../lang/${locale}/${locale}`)
    return { ...locale_data.default }
}

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
export default (
    withIntl({ ssr: true, messagesImporter, extractReqLocale, defaultLocale })(
        withApollo({ ssr: true })(
            withAuth({ ssr: true, USER_QUERY })(MyApp))))
