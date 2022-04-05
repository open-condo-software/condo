const fs = require('fs')
const path = require('path')
const { escape, isEmpty, get } = require('lodash')
const { LOCALES, EN_LOCALE, RU_LOCALE } = require('@condo/domains/common/constants/locale')
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
    templateEngine,
    TEMPLATE_ENGINE_DEFAULT_DATE_FORMAT,
} = require('@condo/domains/notification/templates')
const { DEVELOPER_IMPORTANT_NOTE_TYPE } = require('@condo/domains/notification/constants/constants')
const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')
const { createTestMessage } = require('@condo/domains/notification/utils/testSchema')
const emailTransport = require('@condo/domains/notification/transports/email')
const { SHARE_TICKET_MESSAGE_TYPE, CUSTOMER_IMPORTANT_NOTE_TYPE } = require('./constants/constants')
const dayjs = require('dayjs')
const faker = require('faker')
const { makeClientWithRegisteredOrganization } = require('../organization/utils/testSchema/Organization')

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

describe('Templates', () => {
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
                    if (transport === EMAIL_TRANSPORT) {
                        // The email transport may use a text template, html template, or both.
                        // So, at least one of them must exist.
                        const templateFileText = path.resolve(__dirname, folder, `${transport}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
                        const templateFileHtml = path.resolve(__dirname, folder, `${transport}.html.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
                        if (!fs.existsSync(templateFileText) && !fs.existsSync(templateFileHtml)) {
                            console.error(`No template file(s) for ${transport}: ${templateFileText} or ${templateFileHtml}, or single ${DEFAULT_TEMPLATE_FILE_NAME}`)
                            result = false
                        }
                    } else {
                        const templateFile = path.resolve(__dirname, folder, `${transport}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
                        if (!fs.existsSync(templateFile)) {
                            console.error(`No template file for ${transport}: ${templateFile} or ${DEFAULT_TEMPLATE_FILE_NAME}`)
                            result = false
                        }
                    }
                }
            }
        }

        expect(result).toEqual(true)
    })

    it('All email templates have subjects translations', () => {
        let result = true

        for (const locale of Object.keys(LOCALES)) {
            const strings = getTranslations(locale)
            for (const messageType of MESSAGE_TYPES) {
                if (!isTemplateNeeded(messageType, EMAIL_TRANSPORT)) {
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

    it('All push templates have translations for titles', () => {
        let result = true

        for (const locale of Object.keys(LOCALES)) {
            const strings = getTranslations(locale)
            for (const messageType of MESSAGE_TYPES) {
                if (!isTemplateNeeded(messageType, PUSH_TRANSPORT)) {
                    // Skip in case there is no push template needed for some message type.
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

    it('Successfully rendered date by custom filter', () => {
        const ruWithDefaultFormat = templateEngine.renderString('Date of the first commit in condo is {{ \'2020-04-19\' | dateFormat(\'ru\') }}')
        expect(ruWithDefaultFormat).toEqual('Date of the first commit in condo is 19 апреля 2020')

        const ruWithCustomFormat = templateEngine.renderString('Date of the first commit in condo is {{ \'2020-04-19\' | dateFormat(\'ru\', \'DD MMM YYYY\') }}')
        expect(ruWithCustomFormat).toEqual('Date of the first commit in condo is 19 апр. 2020')

        const enWithDefaultFormat = templateEngine.renderString('Date of the first commit in condo is {{ \'2020-04-19\' | dateFormat(\'en\') }}')
        expect(enWithDefaultFormat).toEqual('Date of the first commit in condo is 19 April 2020')

        const enWithCustomFormat = templateEngine.renderString('Date of the first commit in condo is {{ \'2020-04-19\' | dateFormat(\'en\', \'DD MMM YYYY\') }}')
        expect(enWithCustomFormat).toEqual('Date of the first commit in condo is 19 Apr 2020')
    })

    it('Render json as string', () => {
        const resultObj = templateEngine.renderString('{{ someData | dump | safe }}', { someData: { a: 1, b: '2' } })
        expect(resultObj).toEqual('{"a":1,"b":"2"}')

        const resultStr = templateEngine.renderString('{{ someStr | dump | safe }}', { someStr: 'Hello, World!' })
        expect(resultStr).toEqual('"Hello, World!"')
    })

    it('Render variables into email subject and message body', async () => {
        const client = await makeLoggedInAdminClient()

        const developerData = { type: 'some text for email subject', data: 'Some "string" data' }
        const [messageDeveloper, attrsDeveloper] = await createTestMessage(client, {
            type: DEVELOPER_IMPORTANT_NOTE_TYPE,
            lang: EN_LOCALE,
            meta: { ...developerData, dv: 1 },
        })

        const ticketData = {
            date: dayjs(),
            id: faker.datatype.uuid(),
            ticketNumber: 42,
            details: 'The "ticket" details',
        }
        const [messageShare, attrsShare] = await createTestMessage(client, {
            type: SHARE_TICKET_MESSAGE_TYPE,
            lang: EN_LOCALE,
            meta: { ...ticketData, dv: 1 },
        })

        const preparedMessageDeveloper = await emailTransport.prepareMessageToSend(messageDeveloper)
        const preparedMessageShare = await emailTransport.prepareMessageToSend(messageShare)

        expect(preparedMessageDeveloper.subject).toEqual(developerData.type)
        expect(preparedMessageDeveloper.text.trim()).toEqual(JSON.stringify(`${developerData.data}`))

        expect(preparedMessageShare.subject).toEqual(`Ticket №${ticketData.ticketNumber}`)
        expect(preparedMessageShare.html).toContain(`Ticket #${ticketData.ticketNumber} dated ${dayjs(ticketData.date).locale(LOCALES[EN_LOCALE]).format(TEMPLATE_ENGINE_DEFAULT_DATE_FORMAT)} has been shared with you.`)
        expect(preparedMessageShare.html).toContain(`The text of the ticket: "${escape(ticketData.details)}"`)
    })

    it('Render message after SBBOL auth', async () => {
        const client = await makeClientWithRegisteredOrganization()
        const admin = await makeLoggedInAdminClient()

        client.organization.name = 'Lightning mc\'queen'
        const [message, attrs] = await createTestMessage(admin, {
            type: CUSTOMER_IMPORTANT_NOTE_TYPE,
            lang: RU_LOCALE,
            meta: { organization: client.organization, dv: 1 },
        })

        const preparedMessage = await emailTransport.prepareMessageToSend(message)

        expect(preparedMessage.subject).toEqual('Новая организация. (СББОЛ)')
        expect(preparedMessage.text.trim()).toEqual(`Название: ${escape(client.organization.name)},\nИНН: ${client.organization.meta.inn},`)
    })
})
