const isEmpty = require('lodash/isEmpty')

const { makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')
const { getAvailableLocales, getTranslations } = require('@open-condo/locales/loader')

const { TICKET_SOURCE_PREFIX } = require('@condo/domains/ticket/constants/common')
const { TicketSource } = require('@condo/domains/ticket/utils/testSchema')

const TICKET_SOURCE_IDS_BY_TYPE = {
    EMAIL: '0e9af80b-b5f0-4667-9f8e-577f1cab1a21',
    MOBILE_APP: '3068d49a-a45c-4c3a-a02d-ea1a53e1febb',
    REMOTE_SYSTEM: '69067480-e117-4e4d-8875-3970c79d6da3',
    CALL: '779d7bb6-b194-4d2c-a967-1f7321b2787f',
    OTHER: '7da1e3be-06ba-4c9e-bba6-f97f278ac6e4',
    VISIT: '8e12e1c4-3911-4cdb-acce-4c20f19d4f9b',
    WEB_APP: 'a6737b2f-0e48-45e3-bd94-71952668666a',
    ORGANIZATION_SITE: 'afb00440-25f8-4508-8f9f-4edc1dc47de7',
    MESSENGER: 'b2e93f41-fa8a-40a0-8748-d404e1a46639',
    SOCIAL_NETWORK: 'e5946771-2b04-498d-a600-5bed68a2d751',
    MOBILE_APP_STAFF: '291e093c-050b-4dbd-96d1-da67c5826b6d',
    MOBILE_APP_RESIDENT: '830d1d89-2d17-4c5b-96d1-21b5cd01a6d3',
    CRM_IMPORT: '92cfa7b1-b793-4c22-ae03-ea2aae1e1315',
}
const SOURCE_IDS = Object.values(TICKET_SOURCE_IDS_BY_TYPE)
const TICKET_SOURCE_NAME_NON_LOCALIZED_TEMPLATE_REGEXP = /^ticket\.source\.([a-zA-Z_]+)\.name$/

describe('TicketSource', () => {
    test.each(getAvailableLocales())('localization [%s]: static sources have translations', async (locale) => {
        const translations = Object.values(getTranslations(locale))
        const admin = await makeLoggedInAdminClient()
        admin.setHeaders({ 'Accept-Language': locale })

        const sources = await TicketSource.getAll(admin, { id_in: SOURCE_IDS })
        const isTranslationCompleted = Object.values(sources).every(source => translations.includes(source.name))

        expect(isTranslationCompleted).toBeTruthy()

        Object.values(sources).forEach(source => {
            expect(source.nameNonLocalized).toBeTruthy()

            const match = source.nameNonLocalized.match(TICKET_SOURCE_NAME_NON_LOCALIZED_TEMPLATE_REGEXP)

            expect(isEmpty(match)).toBeFalsy()
            expect(match[1].length).toBeGreaterThan(0)
            expect(TICKET_SOURCE_IDS_BY_TYPE[match[1]]).toBeTruthy()
        })
    })

    test.each(getAvailableLocales())('Passes request in complex raw backend query', async (locale) => {
        const translations = getTranslations(locale)
        const sourceTranslations = [...Object.keys(translations)].filter(x => x.startsWith(TICKET_SOURCE_PREFIX))
        const sourceNames = sourceTranslations.map(x => translations[x])
        const admin = await makeLoggedInAdminClient()
        admin.setHeaders({ 'Accept-Language': locale })

        const sources = await TicketSource.getAll(admin, {
            organization_is_null: true,
            name_starts_with: TICKET_SOURCE_PREFIX,
        })

        expect(sourceTranslations.length).toBeGreaterThanOrEqual(SOURCE_IDS.length)
        expect(sources.length).toBeGreaterThanOrEqual(SOURCE_IDS.length)
        sources.forEach((source) => {
            expect(sourceNames).toContain(source.name)
        })
    })
})