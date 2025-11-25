import { useEffect, useState, type ReactNode } from 'react'
import { IntlProvider } from 'react-intl'

import { DEFAULT_LOCALE, LOCALES } from '@/domains/common/constants/locales'
import { useLaunchParams } from '@/domains/common/utils/useLaunchParams'

import type { AppProps } from 'next/app'

import en from '@/lang/en/en.json'
import ru from '@/lang/ru/ru.json'


import '@open-condo/ui/dist/styles.min.css'
import 'antd/dist/antd.css'
import '@open-condo/ui/style-vars/css'
import './global.css'

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

function App ({ Component, pageProps, router }: AppProps): ReactNode {
    const { context: { condoLocale, condoUserId } } = useLaunchParams()
    const locale = condoLocale || DEFAULT_LOCALE

    const [appInIFrame, setAppInIFrame] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.self !== window.top && condoUserId) {
            setAppInIFrame(true)
        }
    }, [condoUserId])

    return (
        <IntlProvider locale={condoLocale || locale} messages={MESSAGES[locale as AvailableLocales]}>
            <main >
                <Component {...pageProps}/>
            </main>
        </IntlProvider>
    )
}

export default App
