const fs = require('fs')
const path = require('path')
const { isEmpty, get } = require('lodash')
const { LOCALES } = require('@condo/domains/common/constants/locale')
const { getTranslations } = require('@condo/domains/common/utils/localesLoader')
const {
    MESSAGE_TYPES,
    MESSAGE_TRANSPORTS,
    MESSAGE_TYPES_TRANSPORTS,
    EMAIL_TRANSPORT,
    DEFAULT_TEMPLATE_FILE_EXTENSION,
    DEFAULT_TEMPLATE_FILE_NAME,
    PUSH_TRANSPORT,
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

/**
 * Returns the limited list of transports if set, otherwise returns all transports
 * @param messageType
 * @returns {string[]}
 */
function getPossibleTransports (messageType) {
    return get(MESSAGE_TYPES_TRANSPORTS, messageType, MESSAGE_TRANSPORTS)
}

/**
 * @param {string} messageType
 * @param {string} transport
 * @returns {boolean}
 */
function isTemplateNeeded (messageType, transport) {
    const transports = getPossibleTransports(messageType)
    return !isEmpty(transports[transport])
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
                    // The minimal condition is default template exists.
                    continue
                }

                const transports = getPossibleTransports(messageType)

                for (const transport of transports) {
                    const templateFile = path.resolve(__dirname, folder, `${transport}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
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
                if (isTemplateNeeded(messageType, EMAIL_TRANSPORT)) {
                    // Skip in case there is no email template needed for some message type.
                    continue
                }
                const targetKey = translationStringKeyForEmailSubject(messageType)
                if (isEmpty(get(strings, targetKey, null))) {
                    console.error(`There is no "${targetKey}" translation in ${locale}.json`)
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
                if (isTemplateNeeded(messageType, PUSH_TRANSPORT)) {
                    // Skip in case there is no email template needed for some message type.
                    continue
                }
                const targetKey = translationStringKeyForPushTitle(messageType)
                if (isEmpty(get(strings, targetKey, null))) {
                    console.error(`There is no "${targetKey}" translation in ${locale}.json`)
                    result = false
                }
            }
        }

        expect(result).toEqual(true)
    })

    test.todo('Test custom filter for nunjucks: dateFormat')
})
