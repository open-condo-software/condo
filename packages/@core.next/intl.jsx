import { IntlProvider, useIntl } from 'react-intl'
import React, { useState, useEffect } from 'react'
import cookie from 'js-cookie'
import nextCookie from 'next-cookies'

const { DEBUG_RERENDERS, preventInfinityLoop, getContextIndependentWrappedInitialProps } = require('./_utils')

const LocaleContext = React.createContext({})

let defaultLocale = 'en'

let messagesImporter = (locale) => import(`./${locale}.json`)

let getMessages = async (locale) => {
    try {
        const module = await messagesImporter(locale)
        return module.default || module
    } catch (error) {
        console.error('getMessages error:', error)
        const module = import(`./lang/en.json`)
        return module.default
    }
}

let getLocale = () => {
    let locale = null
    if (typeof window !== 'undefined') {
        locale = cookie.get('locale')
        if (!locale && navigator) {
            locale = navigator.language.slice(0, 2)
        }
    }
    return locale || defaultLocale
}

let extractReqLocale = (req) => {
    try {
        const cookieLocale = nextCookie({ req }).locale
        const headersLocale = req.headers['accept-language'].slice(0, 2)
        return cookieLocale || headersLocale || defaultLocale
    } catch (e) {
        return null
    }
}

const Intl = ({ children, initialLocale, initialMessages, onError }) => {
    const [locale, setLocale] = useState(initialLocale || getLocale())
    const [messages, setMessages] = useState(initialMessages)
    useEffect(() => {
        getMessages(locale).then(importedMessages => {
            if (JSON.stringify(messages) === JSON.stringify(importedMessages)) return
            if (DEBUG_RERENDERS) console.log('IntlProvider() newMessages and newLocale', locale)
            setMessages(importedMessages)
            cookie.set('locale', locale, { expires: 365 })
        })
    }, [locale])

    if (DEBUG_RERENDERS) console.log('IntlProvider()', locale)

    return (
        <IntlProvider key={locale} locale={locale} messages={messages} onError={onError}>
            <LocaleContext.Provider value={{ locale, setLocale }}>
                {children}
            </LocaleContext.Provider>
        </IntlProvider>
    )
}

if (DEBUG_RERENDERS) Intl.whyDidYouRender = true

const withIntl = ({ ssr = false, ...opts } = {}) => PageComponent => {
    defaultLocale = opts.defaultLocale ? opts.defaultLocale : 'en'
    // TODO(pahaz): refactor it. No need to patch globals here!
    messagesImporter = opts.messagesImporter ? opts.messagesImporter : messagesImporter
    getMessages = opts.getMessages ? opts.getMessages : getMessages
    getLocale = opts.getLocale ? opts.getLocale : getLocale
    const onIntlError = opts.hideErrors ? (() => {}) : null

    const WithIntl = ({ locale, messages, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithIntl()', locale)
        return (
            <Intl initialLocale={locale} initialMessages={messages} onError={onIntlError}>
                <PageComponent {...pageProps} />
            </Intl>
        )
    }

    if (DEBUG_RERENDERS) WithIntl.whyDidYouRender = true

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithIntl.displayName = `withIntl(${displayName})`
    }

    if (ssr || PageComponent.getInitialProps) {
        WithIntl.getInitialProps = async ctx => {
            const inAppContext = Boolean(ctx.ctx)
            const req = (inAppContext) ? ctx.ctx.req : ctx.req
            const locale = extractReqLocale(req)
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
