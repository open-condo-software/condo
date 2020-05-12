import { IntlProvider } from 'react-intl'
import React from 'react'
import App from 'next/app'

const LocaleContext = React.createContext({
    locale: 'en',
    setLocale: () => null,
})

const getMessages = async (locale) => {
    try {
        return require(`../lang/${locale}.json`)
    } catch (error) {
        console.error(error)
        return require(`../lang/en.json`)
    }
}

const getLocale = (defaultLocale) => {
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
    const [locale, setLocale] = React.useState(getLocale(props.locale))
    const [messages, setMessages] = React.useState(props.messages || {})
    React.useEffect(() => {
        getMessages(locale).then(messages => setMessages(messages))
    }, [locale])

    return (
        <IntlProvider key={locale} locale={locale} messages={messages}>
            <LocaleContext.Provider value={{ locale, setLocale }}>
                {props.children}
            </LocaleContext.Provider>
        </IntlProvider>
    )
}

function extractReqLocale (req) {
    try {
        return req.headers['accept-language'].slice(0, 2)
    } catch (e) {
        return null
    }
}

export const withIntl = ({ ssr = false } = {}) => PageComponent => {
    const WithIntl = ({ locale, messages, ...pageProps }) => {
        return (
            <Intl locale={locale} messages={messages}>
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

            if (ctx.router.route === '/_error') {
                // prevent infinity loop: https://github.com/zeit/next.js/issues/6973
                console.dir(ctx.router)
                if (inAppContext && ctx.ctx.err) {
                    throw ctx.ctx.err
                } else {
                    throw new Error(`${WithIntl.displayName}: catch error!`)
                }
            }

            const locale = getLocale((req) ? extractReqLocale(req) : 'en')
            const messages = await getMessages(locale)

            // Run wrapped getInitialProps methods
            let pageProps = {}
            if (PageComponent.getInitialProps) {
                pageProps = await PageComponent.getInitialProps(ctx)
            } else if (inAppContext) {
                pageProps = await App.getInitialProps(ctx)
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
