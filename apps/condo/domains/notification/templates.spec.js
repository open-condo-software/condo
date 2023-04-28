/**
 * @jest-environment node
 */

const fs = require('fs')
const path = require('path')

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')
const { escape, isEmpty, get, sample } = require('lodash')

const { makeLoggedInAdminClient, setFakeClientMode } = require('@open-condo/keystone/test.utils')
const { getTranslations, getAvailableLocales } = require('@open-condo/locales/loader')

const { LOCALES, EN_LOCALE, RU_LOCALE } = require('@condo/domains/common/constants/locale')
const {
    MESSAGE_TYPES,
    MESSAGE_TRANSPORTS,
    MESSAGE_DELIVERY_OPTIONS,
    EMAIL_TRANSPORT,
    DEFAULT_TEMPLATE_FILE_EXTENSION,
    DEFAULT_TEMPLATE_FILE_NAME,
    PUSH_TRANSPORT,
    DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE,
    BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE,
    RESET_PASSWORD_MESSAGE_TYPE,
    DEVELOPER_IMPORTANT_NOTE_TYPE,
    SMS_FORBIDDEN_SYMBOLS_REGEXP,
} = require('@condo/domains/notification/constants/constants')
const {
    translationStringKeyForEmailSubject,
    translationStringKeyForPushTitle,
    templateEngine,
    substituteTranslations,
    TEMPLATE_ENGINE_DEFAULT_DATE_FORMAT,
} = require('@condo/domains/notification/templates')
const emailTransport = require('@condo/domains/notification/transports/email')
const pushTransport = require('@condo/domains/notification/transports/push')
const smsTransport = require('@condo/domains/notification/transports/sms')
const { createTestMessage } = require('@condo/domains/notification/utils/testSchema')
const { makeClientWithRegisteredOrganization } = require('@condo/domains/organization/utils/testSchema/Organization')

const { SHARE_TICKET_MESSAGE_TYPE, CUSTOMER_IMPORTANT_NOTE_TYPE } = require('./constants/constants')

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
    return get(MESSAGE_DELIVERY_OPTIONS, [messageType, 'allowedTransports'], MESSAGE_TRANSPORTS)
}

/**
 * @param {string} messageType
 * @param {string} transport
 * @returns {boolean}
 */
function isTemplateNeeded (messageType, transport) {
    const transports = getPossibleTransports(messageType)
    return transports.includes(transport)
}

const ORGANIZATION_NAME_WITH_QUOTES = 'ООО "УК "РЕЗИДЕНЦИЯ У МОРЯ"'
const TOKEN_URL_PART = 'auth/change-password?token='

describe('Templates', () => {
    setFakeClientMode(index)

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
        const [messageDeveloper] = await createTestMessage(client, {
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
        const [messageShare] = await createTestMessage(client, {
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
        const [message] = await createTestMessage(admin, {
            type: CUSTOMER_IMPORTANT_NOTE_TYPE,
            lang: RU_LOCALE,
            meta: { organization: client.organization, dv: 1 },
        })

        const preparedMessage = await emailTransport.prepareMessageToSend(message)

        expect(preparedMessage.subject).toEqual('Новая организация. (СББОЛ)')
        expect(preparedMessage.text.trim()).toEqual(`Название: ${client.organization.name},\nИНН: ${client.organization.tin},`)
    })

    it('Employee inviting rendered SMS message does not contain forbidden symbols (value is normalized)', async () => {
        const admin = await makeLoggedInAdminClient()
        const [message] = await createTestMessage(admin, {
            type: DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE,
            lang: RU_LOCALE,
            phone: '+79999999999',
            meta: {
                dv: 1,
                organizationName: ORGANIZATION_NAME_WITH_QUOTES,
            },
        })
        const preparedMessage = await smsTransport.prepareMessageToSend(message)

        expect(preparedMessage.message).not.toMatch(SMS_FORBIDDEN_SYMBOLS_REGEXP)
    })

    it('Password restoration rendered SMS message is not broken and does not contain forbidden symbols (value is normalized)', async () => {
        const admin = await makeLoggedInAdminClient()
        const token = faker.datatype.uuid()
        const [message] = await createTestMessage(admin, {
            type: RESET_PASSWORD_MESSAGE_TYPE,
            lang: RU_LOCALE,
            phone: '+79999999999',
            meta: {
                dv: 1,
                token,
            },
        })
        const preparedMessage = await smsTransport.prepareMessageToSend(message)

        expect(preparedMessage.message).not.toMatch(SMS_FORBIDDEN_SYMBOLS_REGEXP)
        expect(preparedMessage.message).toMatch(`${TOKEN_URL_PART}${token}`)
    })

    describe('Translation tests', () => {
        it('Checks that template keys value translation is substituted correctly for email', async () => {
            const locale = sample(getAvailableLocales())
            const translations = getTranslations(locale)
            const categoryName = sample(Object.keys(translations).filter(item => item.includes('.declined')))
            const message = {
                sender: { dv: 1, fingerprint: 'send-resident-message' },
                type: BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE,
                email: faker.internet.email(),
                lang: locale,
                meta: {
                    dv: 1,
                    data: {
                        userId: faker.datatype.uuid(),
                        url: faker.random.alphaNumeric(20),
                        residentId: faker.datatype.uuid(),
                        propertyId: faker.datatype.uuid(),
                        period: faker.datatype.uuid(),
                        categoryId: faker.datatype.uuid(),
                    },
                    categoryName,
                },
            }

            const preparedMessage = await emailTransport.prepareMessageToSend(message)
            const categoryValue = translations[categoryName]

            expect(preparedMessage.text).toContain(categoryValue)
            expect(preparedMessage.text).not.toContain(categoryName)
        })

        it('Checks that template keys value translation is substituted correctly for sms', async () => {
            const locale = sample(getAvailableLocales())
            const translations = getTranslations(locale)
            const categoryName = sample(Object.keys(translations).filter(item => item.includes('.declined')))
            const message = {
                sender: { dv: 1, fingerprint: 'send-resident-message' },
                type: BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE,
                phone: '+79999999999',
                lang: locale,
                meta: {
                    dv: 1,
                    data: {
                        userId: faker.datatype.uuid(),
                        url: faker.random.alphaNumeric(20),
                        residentId: faker.datatype.uuid(),
                        propertyId: faker.datatype.uuid(),
                        period: faker.datatype.uuid(),
                        categoryId: faker.datatype.uuid(),
                    },
                    categoryName,
                },
            }

            const preparedMessage = await smsTransport.prepareMessageToSend(message)
            const categoryValue = translations[categoryName]

            expect(preparedMessage.message).toContain(categoryValue)
            expect(preparedMessage.message).not.toContain(categoryName)
        })

        it('Checks that template keys value translation is substituted correctly for push', async () => {
            const locale = sample(getAvailableLocales())
            const translations = getTranslations(locale)
            const categoryName = sample(Object.keys(translations).filter(item => item.includes('.declined')))
            const message = {
                sender: { dv: 1, fingerprint: 'send-resident-message' },
                type: BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE,
                user: { id: faker.datatype.uuid() },
                lang: locale,
                meta: {
                    dv: 1,
                    data: {
                        userId: faker.datatype.uuid(),
                        url: faker.random.alphaNumeric(20),
                        residentId: faker.datatype.uuid(),
                        propertyId: faker.datatype.uuid(),
                        period: faker.datatype.uuid(),
                        categoryId: faker.datatype.uuid(),
                    },
                    categoryName,
                },
            }

            const preparedMessage = await pushTransport.prepareMessageToSend(message)
            const categoryValue = translations[categoryName]

            expect(preparedMessage.notification.body).toContain(categoryValue)
            expect(preparedMessage.notification.body).not.toContain(categoryName)
        })

        it('Checks that all nested keys in object are translated correctly', async () => {
            const locale = sample(getAvailableLocales())
            const translations = getTranslations(locale)
            const keys = Object.keys(translations).filter(item => item.includes('.declined'))
            const [key1, key2, key3] = [sample(keys), sample(keys), sample(keys)]

            const message = {
                key1,
                meta: {
                    key2,
                    data: {
                        key3,
                        array: [
                            key1,
                            { key2 },
                        ],
                    },
                },
            }

            const translated = substituteTranslations(message, locale)

            expect(substituteTranslations(key1, locale)).toEqual(translations[key1])
            expect(substituteTranslations(key2, locale)).toEqual(translations[key2])
            expect(substituteTranslations(key3, locale)).toEqual(translations[key3])
            expect(translated.key1).toEqual(translations[key1])
            expect(translated.meta.key2).toEqual(translations[key2])
            expect(translated.meta.data.key3).toEqual(translations[key3])
            expect(translated.meta.data.array[0]).toEqual(translations[key1])
            expect(translated.meta.data.array[1].key2).toEqual(translations[key2])
        })
    })
})
