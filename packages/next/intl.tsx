import cookie from 'js-cookie'
import get from 'lodash/get'
import { NextPage } from 'next'
import nextCookie from 'next-cookies'
import React, { useContext, useEffect, useState } from 'react'
import { IntlProvider, useIntl, FormattedMessage } from 'react-intl'

import { isSSR } from '@open-condo/miniapp-utils'

import { DEBUG_RERENDERS, DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER, preventInfinityLoop, getContextIndependentWrappedInitialProps } from './_utils'
import { useAuth } from './auth'

import type { IntlConfig } from 'react-intl'


interface ILocaleContext {
    locale
    setLocale
}

type MessagesImporter = (locale: string) => Promise<any>
type GetMessages = (locale: string) => Promise<Record<string, string>>
type ExtractReqLocale = (req) => string | null
type GetLocale = () => string | null


let defaultLocale = 'en'

const LocaleContext = React.createContext<ILocaleContext>({
    locale: defaultLocale,
    setLocale: () => ({}),
})

const useLocale = (): ILocaleContext => useContext(LocaleContext)

let messagesImporter: MessagesImporter = () => {
    throw new Error('You should define your own "messagesImporter(locale)" function. ' +
        'Like so: "withIntl({ ..., messagesImporter: (locale) => import(`../lang/${locale}/${locale}`) })(...)"')
}

let getMessages: GetMessages = async (locale) => {
    try {
        const module = await messagesImporter(locale)
        return module.default || module
    } catch (error) {
        console.error('getMessages error:', error)
        const module = await import(`./lang/${defaultLocale}/${defaultLocale}.json`)
        return module.default
    }
}

let extractReqLocale: ExtractReqLocale = (req) => {
    try {
        const cookieLocale = nextCookie({ req }).locale
        const headersLocale = req.headers['accept-language'] && req.headers['accept-language'].slice(0, 2)
        return cookieLocale || headersLocale || defaultLocale
    } catch (e) {
        return null
    }
}

let getLocale: GetLocale = () => {
    let locale = null
    if (typeof window !== 'undefined') {
        try {
            locale = cookie.get('locale')
            if (!locale && navigator) {
                locale = navigator.language.slice(0, 2)
            }
        } catch (e) {
            locale = null
        }
    }
    return locale || defaultLocale
}


const initOnRestore = async (ctx) => {
    let locale, messages
    const isOnServerSide = typeof window === 'undefined'
    if (isOnServerSide) {
        const inAppContext = Boolean(ctx.ctx)
        const req = (inAppContext) ? ctx.ctx.req : ctx.req
        locale = extractReqLocale(req) || defaultLocale
        messages = await getMessages(locale)
    } else {
        locale = getLocale()
        messages = await getMessages(locale)
    }
    return { locale, messages }
}

type IntlProps = {
    initialLocale?: string
    initialMessages?: Record<string, string>
    onError?: IntlConfig['onError']
}

const Intl: React.FC<IntlProps> = ({ children, initialLocale, initialMessages, onError }) => {
    const { user, isLoading: isUserLoading } = useAuth()
    const [locale, setLocale] = useState(initialLocale)
    const [messages, setMessages] = useState(initialMessages)

    useEffect(() => {
        if (!isUserLoading && !!user) {
            setLocale((prevLocale) => {
                return get(user, 'locale', prevLocale || initialLocale) || prevLocale || initialLocale
            })
        }
    }, [isUserLoading, user])

    useEffect(() => {
        getMessages(locale).then(importedMessages => {
            if (JSON.stringify(messages) === JSON.stringify(importedMessages)) return
            if (DEBUG_RERENDERS) console.log('IntlProvider() newMessages and newLocale', locale)
            setMessages(importedMessages)
            cookie.set('locale', locale, { expires: 365 })
        })
    }, [locale, messages])

    if (DEBUG_RERENDERS) console.log('IntlProvider()', locale)

    return (
        <IntlProvider key={locale} locale={locale} messages={messages} onError={onError}>
            <LocaleContext.Provider value={{ locale, setLocale }}>
                {children}
            </LocaleContext.Provider>
        </IntlProvider>
    )
}

// @ts-ignore
if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) Intl.whyDidYouRender = true

type WithIntlProps = {
    ssr?: boolean
    defaultLocale?: string
    extractReqLocale?: ExtractReqLocale
    messagesImporter?: MessagesImporter
    getMessages?: GetMessages
    getLocale?: GetLocale
    hideErrors?: boolean
}
export type WithIntlType = (props: WithIntlProps) => (PageComponent: NextPage<any>) => NextPage<any>

const withIntl: WithIntlType = ({ ssr = false, ...opts }: WithIntlProps = {}) => PageComponent => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    defaultLocale = opts.defaultLocale || defaultLocale
    extractReqLocale = opts.extractReqLocale || extractReqLocale
    messagesImporter = opts.messagesImporter ? opts.messagesImporter : messagesImporter
    getMessages = opts.getMessages ? opts.getMessages : getMessages
    getLocale = opts.getLocale ? opts.getLocale : getLocale
    const onIntlError = opts.hideErrors ? (() => ({})) : undefined

    const WithIntl = ({ locale, messages, ...pageProps }) => {
        // in there is no locale and no messages => client side rerender (we should use some client side cache)
        if (!locale) locale = getLocale()
        if (!messages) messages = {}
        if (DEBUG_RERENDERS) console.log('WithIntl()', locale)
        return (
            <Intl initialLocale={locale} initialMessages={messages} onError={onIntlError}>
                <PageComponent {...pageProps} />
            </Intl>
        )
    }

    if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) WithIntl.whyDidYouRender = true

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithIntl.displayName = `withIntl(${displayName})`
    }

    if (ssr || !isSSR() || PageComponent.getInitialProps) {
        WithIntl.getInitialProps = async ctx => {
            if (DEBUG_RERENDERS) console.log('WithIntl.getInitialProps()', ctx)
            const { locale, messages } = await initOnRestore(ctx)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            if (isSSR()) {
                preventInfinityLoop(ctx)
            }

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
    FormattedMessage,
    LocaleContext,
    useLocale,
}
