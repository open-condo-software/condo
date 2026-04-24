import { ApolloProvider } from '@apollo/client'
import { ConfigProvider } from 'antd'
import en from 'lang/en.json'
import ru from 'lang/ru.json'
import get from 'lodash/get'
import getConfig from 'next/config'
import { Noto_Sans_Mono }  from 'next/font/google'
import localFont from 'next/font/local'
import { useMemo } from 'react'
import { IntlProvider } from 'react-intl'

import { CachePersistorContext } from '@open-condo/apollo'

import { CreateAppContextProvider } from '@/domains/common/components/CreateAppContext'
import { SeoProvider } from '@/domains/common/components/SeoProvider'
import { theme } from '@/domains/common/constants/antd'
import { LOCALES, DEFAULT_LOCALE } from '@/domains/common/constants/locales'
import { useApollo } from '@/domains/common/utils/apollo'
import { AuthProvider } from '@/domains/user/utils/auth'

import type { AppProps } from 'next/app'
import type { ReactNode } from 'react'


import 'antd/dist/reset.css'
import '@open-condo/ui/dist/styles.min.css'
import '@open-condo/ui/style-vars/css'
import 'easymde/dist/easymde.min.css'
import './global.css'

const mainFont = localFont({
    src: '../public/WixMadeForDisplay.woff2',
    variable: '--condo-font-fallback',
})
const monoFont = Noto_Sans_Mono({
    subsets: ['latin', 'cyrillic'],
    variable: '--condo-font-fallback-mono',
    style: ['normal'],
})

const { publicRuntimeConfig: { runtimeTranslations } } = getConfig()

type AvailableLocales = typeof LOCALES[number]
// NOTE: Combine all keys together
type MessagesKeysType = keyof typeof en | keyof typeof ru
// NOTE: Require all message keys in all languages, so no lint translations needed
type MessagesType = { [Locale in AvailableLocales]: { [Key in MessagesKeysType]: string } }

const MESSAGES: MessagesType = {
    ru,
    en,
}

// NOTE: Override global interface allows us to use autocomplete in intl
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace FormatjsIntl {
        interface Message {
            ids: MessagesKeysType
        }
    }
}

function DevPortalApp ({ Component, pageProps, router }: AppProps): ReactNode {
    const { locale = DEFAULT_LOCALE } = router
    const { client, cachePersistor } = useApollo(pageProps)

    const messages = useMemo(() => {
        return { ...get(MESSAGES, locale), ...runtimeTranslations[locale] }
    }, [locale])

    return (
        <IntlProvider locale={locale} messages={messages}>
            <SeoProvider/>
            <ApolloProvider client={client}>
                <CachePersistorContext.Provider value={{ persistor: cachePersistor }}>
                    <AuthProvider>
                        <ConfigProvider theme={theme}>
                            <main className={`${mainFont.variable} ${monoFont.variable}`}>
                                <CreateAppContextProvider>
                                    <Component {...pageProps}/>
                                </CreateAppContextProvider>
                            </main>
                        </ConfigProvider>
                    </AuthProvider>
                </CachePersistorContext.Provider>
            </ApolloProvider>
        </IntlProvider>
    )
}

export default DevPortalApp
