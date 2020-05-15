import { IntlProvider, useIntl } from 'react-intl'
import React from 'react'
import cookie from 'js-cookie'
import nextCookie from 'next-cookies'

const { preventInfinityLoop, getContextIndependentWrappedInitialProps } = require('./_utils')

const LocaleContext = React.createContext({
    locale: 'en',
    setLocale: () => null,
})

let messagesImporter = (locale) => import(`./${locale}.json`)

let getMessages = async (locale) => {
    try {
        return messagesImporter(locale)
    } catch (error) {
        console.error(error)
        return import(`./lang/en.json`)
    }
}

let getLocale = (defaultLocale) => {
    let locale = null
    if (typeof window !== 'undefined') {
        if (localStorage) {
            locale = localStorage.getItem('locale')
        }
        if (!locale && navigator) {
            locale = navigator.language.slice(0, 2)
        }
    }
    return locale || defaultLocale || 'en'
}

function Intl (props) {
    const [locale, setLocale] = React.useState(props.locale)
    const [messages, setMessages] = React.useState(props.messages)
    React.useEffect(() => {
        getMessages(locale).then(messages => {
            setMessages(messages)
            cookie.set('locale', locale, { expires: 365 })
        })
    }, [locale])

    return (
        <IntlProvider key={locale} locale={locale} messages={messages} onError={props.onError}>
            <LocaleContext.Provider value={{ locale, setLocale }}>
                {props.children}
            </LocaleContext.Provider>
        </IntlProvider>
    )
}

function extractReqLocale (req) {
    try {
        const cookieLocale = nextCookie({ req }).locale
        const headersLocale = req.headers['accept-language'].slice(0, 2)
        return cookieLocale || headersLocale
    } catch (e) {
        return null
    }
}

const withIntl = ({ ssr = false, ...opts } = {}) => PageComponent => {
    const defaultLocale = opts.defaultLocale ? opts.defaultLocale : 'en'
    // TODO(pahaz): refactor it. No need to patch globals here!
    messagesImporter = opts.messagesImporter ? opts.messagesImporter : messagesImporter
    getMessages = opts.getMessages ? opts.getMessages : getMessages
    getLocale = opts.getLocale ? opts.getLocale : getLocale
    const onIntlError = opts.hideErrors ? (() => {}) : null

    const WithIntl = ({ locale, messages, ...pageProps }) => {
        return (
            <Intl locale={locale || defaultLocale} messages={messages || {}} onError={onIntlError}>
                <PageComponent {...pageProps} />
            </Intl>
        )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithIntl.displayName = `withIntl(${displayName})`
    }

    if (ssr || PageComponent.getInitialProps) {
        WithIntl.getInitialProps = async ctx => {
            const inAppContext = Boolean(ctx.ctx)
            const req = (inAppContext) ? ctx.ctx.req : ctx.req
            const locale = getLocale((req) ? extractReqLocale(req) : defaultLocale)
            const messages = await getMessages(locale)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            preventInfinityLoop(ctx)

            return {
                ...pageProps,
                locale,
                messages,
            }
        }
    }

    return WithIntl
}

export {
    withIntl,
    useIntl,
}
