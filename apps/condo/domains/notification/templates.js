const conf = require('@core/config')
const dayjs = require('dayjs')
const { get } = require('lodash')
const Nunjucks = require('nunjucks')
const path = require('path')
const fs = require('fs')
const { LOCALES } = require('@condo/domains/common/constants/locale')

const {
    MESSAGE_TRANSPORTS,
    EMAIL_TRANSPORT,
    SMS_TRANSPORT,
    TELEGRAM_TRANSPORT,
    PUSH_TRANSPORT,
    TICKET_EXECUTOR_CONNECTED_TYPE,
    DEFAULT_TEMPLATE_FILE_NAME,
    DEFAULT_TEMPLATE_FILE_EXTENSION,
} = require('./constants/constants')
const { i18n } = require('@condo/domains/common/utils/localesLoader')

const {
    getTicketExecutorConnectedMessage,
} = require('./ticketTemplates')

const LANG_DIR_RELATED = '../../lang'
const TEMPLATE_ENGINE_DEFAULT_DATE_FORMAT = 'D MMMM YYYY'

const nunjucks = new Nunjucks.Environment(new Nunjucks.FileSystemLoader(path.resolve(__dirname, LANG_DIR_RELATED)))
nunjucks.addFilter('dateFormat', function (dateStr, locale, format) {
    return dayjs(dateStr).locale(LOCALES[locale || conf.DEFAULT_LOCALE]).format(format || TEMPLATE_ENGINE_DEFAULT_DATE_FORMAT)
})

/**
 * @param {string} lang
 * @param {string} messageType
 * @param {string} transportType
 *
 * @returns {string}
 */
function getTemplate (lang, messageType, transportType) {
    const defaultTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${lang}/messages/${messageType}/${DEFAULT_TEMPLATE_FILE_NAME}`)
    const transportTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${lang}/messages/${messageType}/${transportType}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)

    if (fs.existsSync(transportTemplatePath)) {
        return transportTemplatePath
    }

    if (fs.existsSync(defaultTemplatePath)) {
        return defaultTemplatePath
    }

    throw new Error(`There is no "${lang}" template for "${messageType}" to send by "${transportType}"`)
}

/**
 * Separated function for email templates, because we have to detect html format
 * @param {string} lang
 * @param {string} messageType
 *
 * @returns {{templatePathText: ?string, templatePathHtml: ?string}}
 */
function getEmailTemplate (lang, messageType) {
    const defaultTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${lang}/messages/${messageType}/${DEFAULT_TEMPLATE_FILE_NAME}`)
    const emailTextTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${lang}/messages/${messageType}/${EMAIL_TRANSPORT}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
    const emailHtmlTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${lang}/messages/${messageType}/${EMAIL_TRANSPORT}.html.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)

    let templatePathText = null
    let templatePathHtml = null

    if (fs.existsSync(emailTextTemplatePath)) {
        templatePathText = emailTextTemplatePath
    }

    if (fs.existsSync(emailHtmlTemplatePath)) {
        templatePathHtml = emailHtmlTemplatePath
    }

    if (!templatePathText && !templatePathHtml && fs.existsSync(defaultTemplatePath)) {
        templatePathText = defaultTemplatePath
    }

    if (templatePathText || templatePathHtml) {
        return { templatePathText, templatePathHtml }
    }

    throw new Error(`There is no "${lang}" template for "${messageType}" to send by "${EMAIL_TRANSPORT}"`)
}

/**
 * @param {string} messageType
 * @returns {string}
 */
function translationStringKeyForEmailSubject (messageType) {
    return `notification.messages.${messageType}.${EMAIL_TRANSPORT}.subject`
}

/**
 * @param {string} messageType
 * @returns {string}
 */
function translationStringKeyForPushTitle (messageType) {
    return `notification.messages.${messageType}.${PUSH_TRANSPORT}.title`
}

function smsRenderer ({ message, env }) {
    return {
        text: nunjucks.render(getTemplate(message.lang, message.type, SMS_TRANSPORT), { message, env }),
    }
}

function emailRenderer ({ message, env }) {
    const { lang, meta } = message
    const { templatePathText, templatePathHtml } = getEmailTemplate(message.lang, message.type)
    const ret = {
        subject: i18n(translationStringKeyForEmailSubject(message.type), { lang, meta }),
    }

    if (templatePathText) {
        ret.text = nunjucks.render(templatePathText, { message, env })
    }

    if (templatePathHtml) {
        ret.html = nunjucks.render(templatePathHtml, { message, env })
    }

    return ret
}

function telegramRenderer ({ message, env }) {
    throw new Error('There was no telegram transport. Please write the renderer for Telegram.')
}

function pushRenderer ({ message, env }) {
    const { lang, meta } = message
    return {
        notification: {
            title: i18n(translationStringKeyForPushTitle(message.type), { lang, meta }),
            body: nunjucks.render(getTemplate(message.lang, message.type, PUSH_TRANSPORT), { message, env }),
        },
        data: get(message, ['meta', 'pushData'], null),
        userId: get(message, ['meta', 'userId'], null),
    }
}

/**
 * Template environment variable type
 * @typedef {Object} MessageTemplateEnvironment
 * @property {string} serverUrl - server url may use for building links
 */

/**
 *
 * @type {Object<string, function({message: Message, env: MessageTemplateEnvironment}): Object>}
 */
const MESSAGE_TRANSPORTS_RENDERERS = {
    [SMS_TRANSPORT]: smsRenderer,
    [EMAIL_TRANSPORT]: emailRenderer,
    [TELEGRAM_TRANSPORT]: telegramRenderer,
    [PUSH_TRANSPORT]: pushRenderer,
}

const transportsWithRenderers = Object.keys(MESSAGE_TRANSPORTS_RENDERERS)

async function renderTemplate (transport, message) {
    if (!MESSAGE_TRANSPORTS.includes(transport)) {
        throw new Error('unexpected transport argument')
    }

    if (!transportsWithRenderers.includes(transport)) {
        throw new Error(`No renderer for ${transport} messages`)
    }

    const serverUrl = conf.SERVER_URL

    /**
     * @type {MessageTemplateEnvironment}
     */
    const env = { serverUrl }

    const renderMessage = MESSAGE_TRANSPORTS_RENDERERS[transport]
    return renderMessage({ message, env })

    if (message.type === TICKET_EXECUTOR_CONNECTED_TYPE) {
        return getTicketExecutorConnectedMessage(message, transport)
    }
}

module.exports = {
    renderTemplate,
    getEmailTemplate,
    translationStringKeyForEmailSubject,
    translationStringKeyForPushTitle,
    templateEngine: nunjucks,
    TEMPLATE_ENGINE_DEFAULT_DATE_FORMAT,
}
