import { LocaleContext } from '@open-condo/next/intl'

export const CommonSettingsContent = () => {
    return (
        <LocaleContext.Consumer>
            {({ locale, setLocale }) => {
                return (
                    <div>
                        <button onClick={() => setLocale('ru')}>{locale === 'ru' ? 'RU' : 'ru'}</button>
                        <button onClick={() => setLocale('en')}>{locale === 'en' ? 'EN' : 'en'}</button>
                    </div>
                )
            }}
        </LocaleContext.Consumer>
    )
}
