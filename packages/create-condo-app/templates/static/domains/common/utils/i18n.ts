import { TranslationsHelper } from '@open-condo/miniapp-utils/helpers/i18n'

import { LOCALES, DEFAULT_LOCALE } from '@/domains/common/constants/locales'

import type { MessagesKeysType } from '@/global'

export type AvailableLocale = typeof LOCALES[number]
export type MessagesShape = Record<MessagesKeysType, string>

async function loadMessages (locale: AvailableLocale): Promise<MessagesShape> {
    return (await import(`@/lang/${locale}.json`)).default
}

async function loadDefaultMessages (): Promise<MessagesShape> {
    return await loadMessages(DEFAULT_LOCALE)
}

export const translationsHelper = new TranslationsHelper({
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    loadMessages,
    loadDefaultMessages,
})

export const withTranslations = translationsHelper.getHOC()
export const useTranslations = translationsHelper.getUseTranslationsHook()
export const parseLocaleString = TranslationsHelper.parseLocaleString