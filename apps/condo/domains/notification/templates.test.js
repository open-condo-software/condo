const fs = require('fs')
const path = require('path')
const { isEmpty, get } = require('lodash')
const { LOCALES } = require('@condo/domains/common/constants/locale')
const { getTranslations } = require('@condo/domains/common/utils/localesLoader')
const {
    MESSAGE_TYPES,
    MESSAGE_TRANSPORTS,
    EMAIL_TRANSPORT,
    DEFAULT_TEMPLATE_FILE_EXTENSION,
    DEFAULT_TEMPLATE_FILE_NAME,
} = require('@condo/domains/notification/constants/constants')
const {
    translationStringKeyForEmailSubject,
    translationStringKeyForPushTitle,
} = require('@condo/domains/notification/templates')

/**
 * The *Relative* path to templates folder
 * @param {string} locale
 * @param {string} messageType
 * @returns {string}
 */
function templateFolder (locale, messageType) {
    return `../../lang/${locale}/messages/${messageType}`
}

describe('Notifications', () => {
    it('All messages types have enough templates', () => {
        let result = true
        for (const locale of Object.keys(LOCALES)) {
            for (const messageType of MESSAGE_TYPES) {
                const folder = templateFolder(locale, messageType)

                const defaultTemplateFile = path.resolve(__dirname, folder, DEFAULT_TEMPLATE_FILE_NAME)
                const hasDefaultTemplate = fs.existsSync(defaultTemplateFile)
                if (hasDefaultTemplate) {
                    continue
                }

                for (const messageTransport of MESSAGE_TRANSPORTS) {
                    const templateFile = path.resolve(__dirname, folder, `${messageTransport}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
                    const hasParticularTransportTemplate = fs.existsSync(templateFile)
                    if (!hasParticularTransportTemplate) {
                        console.error(`No template file: ${templateFile} or ${DEFAULT_TEMPLATE_FILE_NAME}`)
                        result = false
                    }
                }
            }
        }

        expect(result).toEqual(true)
    })

    it('All email templates has subjects translations', () => {
        let result = true

        for (const locale of Object.keys(LOCALES)) {
            const strings = getTranslations(locale)
            for (const messageType of MESSAGE_TYPES) {
                const targetKey = translationStringKeyForEmailSubject(messageType)
                if (isEmpty(get(strings, targetKey, null))) {
                    console.error(`There is no "${targetKey}" translation in ${locale}.json`)
                    result = false
                }
            }
        }

        expect(result).toEqual(true)
    })

    it('Email templates has only one format: text or html', () => {
        let result = true
        for (const locale of Object.keys(LOCALES)) {
            for (const messageType of MESSAGE_TYPES) {
                const folder = templateFolder(locale, messageType)
                const templateFileText = path.resolve(__dirname, folder, `${EMAIL_TRANSPORT}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
                const templateFileHtml = path.resolve(__dirname, folder, `${EMAIL_TRANSPORT}.html.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)

                const textExists = fs.existsSync(templateFileText)
                const htmlExists = fs.existsSync(templateFileHtml)

                if (textExists && htmlExists) {
                    console.error(`One of email templates is redundant: ${templateFileText} or ${templateFileHtml}.`)
                    result = false
                }
            }
        }
        expect(result).toEqual(true)
    })

    it('All push templates has translations for titles', () => {
        let result = true

        for (const locale of Object.keys(LOCALES)) {
            const strings = getTranslations(locale)
            for (const messageType of MESSAGE_TYPES) {
                const targetKey = translationStringKeyForPushTitle(messageType)
                if (isEmpty(get(strings, targetKey, null))) {
                    console.error(`There is no "${targetKey}" translation in ${locale}.json`)
                    result = false
                }
            }
        }

        expect(result).toEqual(true)
    })
})