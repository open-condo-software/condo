import { IntlProvider as BaseIntlProvider } from 'react-intl'

const LocaleContext = React.createContext({
    locale: 'en',
    setLocale: () => null,
})

const getMessages = async (locale) => {
    try {
        return require(`../../lang/${locale}.json`)
    } catch (error) {
        console.error(error)
        return require(`../../lang/en.json`)
    }
}

const getLanguage = () => {
    let language = null
    if (typeof window !== 'undefined') {
        if (localStorage) {
            language = localStorage.getItem('locale')
        }
        if (!language && navigator) {
            language = navigator.language.slice(0, 2)
        }
    }
    return language || 'en'
}

function IntlProvider (props) {
    const [locale, setLocale] = React.useState(getLanguage())
    const [messages, setMessages] = React.useState({})
    React.useEffect(() => {
        getMessages(locale).then(messages => setMessages(messages))
    }, [locale])

    return (
        <BaseIntlProvider key={locale} locale={locale} messages={messages}>
            <LocaleContext.Provider value={{ locale, setLocale }}>
                {props.children}
            </LocaleContext.Provider>
        </BaseIntlProvider>
    )
}

IntlProvider.LocaleContext = LocaleContext

export default IntlProvider
