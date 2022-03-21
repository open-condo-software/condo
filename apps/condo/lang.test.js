const fs = require('fs')
const path = require('path')
const {
    MESSAGE_TYPES, MESSAGE_TRANSPORTS, EMAIL_TRANSPORT,
} = require('@condo/domains/notification/constants/constants')
const { LOCALES } = require('@condo/domains/common/constants/locale')
const { getTranslations } = require('@condo/domains/common/utils/localesLoader')
const { isEmpty, get } = require('lodash')

const EXT = 'html'
const DEFAULT_TEMPLATE = `default.${EXT}`

/**
 * @param {string} locale
 * @param {string} messageType
 * @returns {string}
 */
function templateFolder (locale, messageType) {
    return `./${locale}/messages/${messageType}`
}

/**
 * @param {string} messageType
 * @returns {string}
 */
function translationStringKeyForEmailSubject (messageType) {
    return `notification.messages.${messageType}.${EMAIL_TRANSPORT}.subject`
}

describe('Notifications', () => {
    it('All messages types have enough templates', () => {
        let result = true
        for (const locale of Object.keys(LOCALES)) {
            for (const messageType of MESSAGE_TYPES) {
                const folder = templateFolder(locale, messageType)

                const defaultTemplateFile = path.resolve(__dirname, folder, DEFAULT_TEMPLATE)
                const hasDefaultTemplate = fs.existsSync(defaultTemplateFile)
                if (hasDefaultTemplate) {
                    continue
                }

                for (const messageTransport of MESSAGE_TRANSPORTS) {
                    const templateFile = path.resolve(__dirname, folder, `${messageTransport}.${EXT}`)
                    const hasParticularTransportTemplate = fs.existsSync(templateFile)
                    if (!hasParticularTransportTemplate) {
                        console.error(`No template file: ${templateFile} or ${DEFAULT_TEMPLATE}`)
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
})