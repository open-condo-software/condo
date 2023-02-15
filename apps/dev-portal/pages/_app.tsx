import { Open_Sans }  from '@next/font/google'
import { ConfigProvider, Layout } from 'antd'
import { Header } from 'domains/common/components/Header'
import { theme } from 'domains/common/constants/antd'
import { LOCALES, DEFAULT_LOCALE } from 'domains/common/constants/locales'
import en from 'lang/en.json'
import ru from 'lang/ru.json'
import get from 'lodash/get'
import { IntlProvider } from 'react-intl'

const font = Open_Sans({
    subsets: ['latin', 'cyrillic'],
    variable: '--condo-font-fallback',
    style: ['normal', 'italic'],
})

import type { AppProps } from 'next/app'
import type { ReactNode } from 'react'

import 'antd/dist/reset.css'
import '@open-condo/ui/dist/styles.min.css'
import '@open-condo/ui/style-vars/css'
import './global.css'
import './prism-code-highlight-theme.css'

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

export default function App ({ Component, pageProps, router }: AppProps): ReactNode {
    const { locale = DEFAULT_LOCALE } = router

    return (
        <ConfigProvider theme={theme}>
            <IntlProvider locale={locale} messages={get(MESSAGES, locale, {})}>
                <main className={font.variable}>
                    <Layout>
                        <Header/>
                        <Component {...pageProps}/>
                    </Layout>
                </main>
            </IntlProvider>
        </ConfigProvider>
    )
}
