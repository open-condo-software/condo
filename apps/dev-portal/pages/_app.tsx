import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { ConfigProvider, Layout } from 'antd'
import { theme } from 'domains/common/constants/antd'
import { LOCALES, DEFAULT_LOCALE } from 'domains/common/constants/locales'
import en from 'lang/en.json'
import ru from 'lang/ru.json'
import get from 'lodash/get'
import { IntlProvider } from 'react-intl'

import type { AppProps } from 'next/app'
import type { ReactNode } from 'react'

import 'antd/dist/reset.css'

type AvailableLocales = typeof LOCALES[number]
// NOTE: Combine all keys together
type MessagesKeysType = keyof typeof en | keyof typeof ru
// NOTE: Require all message keys in all languages, so no lint translations needed
type MessagesType = { [Locale in AvailableLocales]: { [Key in MessagesKeysType]: string } }

const MESSAGES: MessagesType = {
    ru,
    en,
}

const EMOTION_CACHE = createCache({ key: 'dev' })

// NOTE: Override global interface allows us to use autocomplete in intl
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace FormatjsIntl {
        interface Message {
            ids: MessagesKeysType
        }
    }
}

export default function App ({ Component, pageProps, router }: AppProps): ReactNode {
    const { locale = DEFAULT_LOCALE } = router

    return (
        <CacheProvider value={EMOTION_CACHE}>
            <ConfigProvider theme={theme}>
                <IntlProvider locale={locale} messages={get(MESSAGES, locale, {})}>
                    <Layout>
                        <Layout.Header>
                            1234
                        </Layout.Header>
                        <Layout>
                            <Component {...pageProps}/>
                        </Layout>
                    </Layout>
                </IntlProvider>
            </ConfigProvider>
        </CacheProvider>
    )
}
