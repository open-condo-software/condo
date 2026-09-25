import getConfig from 'next/config'
const { publicRuntimeConfig: { defaultLocale } } = getConfig()

export const RU_LOCALE = 'ru'
export const EN_LOCALE = 'en'
export const LOCALES = [RU_LOCALE, EN_LOCALE] as const
export const DEFAULT_LOCALE: typeof LOCALES[number] =
    (defaultLocale && LOCALES.includes(defaultLocale))
        ? defaultLocale
        : RU_LOCALE
