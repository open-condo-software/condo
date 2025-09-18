const fs = require('fs')
const path = require('path')

const dayjs = require('dayjs')
const { get, unescape, isObject, isArray } = require('lodash')
const mjml2html = require('mjml')
const Nunjucks = require('nunjucks')

const conf = require('@open-condo/config')
const { i18n, getLocalized } = require('@open-condo/locales/loader')

const { LOCALES } = require('@condo/domains/common/constants/locale')

const {
    MESSAGE_TRANSPORTS,
    EMAIL_TRANSPORT,
    SMS_TRANSPORT,
    TELEGRAM_TRANSPORT,
    PUSH_TRANSPORT,
    DEFAULT_TEMPLATE_FILE_NAME,
    DEFAULT_TEMPLATE_FILE_EXTENSION,
    SMS_FORBIDDEN_SYMBOLS_REGEXP,
} = require('./constants/constants')

const LANG_DIR_RELATED = '../../lang'
const TEMPLATE_ENGINE_DEFAULT_DATE_FORMAT = 'D MMMM YYYY'
const SERVER_URL = conf.SERVER_URL
const SOCIAL_MEDIA_LINKS = conf.SOCIAL_MEDIA_LINKS ? JSON.parse(conf.SOCIAL_MEDIA_LINKS) : {}
const HELP_REQUISITES = conf.HELP_REQUISITES ? JSON.parse(conf.HELP_REQUISITES) : {}
const SUPPORT_EMAIL = get(HELP_REQUISITES, 'support_email') || ''
const LANDING_URL = conf.LANDING_URL ? JSON.parse(conf.LANDING_URL) : {}

// config based path
// nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
const nunjucks = new Nunjucks.Environment(new Nunjucks.FileSystemLoader(path.resolve(__dirname, LANG_DIR_RELATED)))
nunjucks.addFilter('dateFormat', function (dateStr, locale, format) {
    return dayjs(dateStr).locale(LOCALES[locale || conf.DEFAULT_LOCALE]).format(format || TEMPLATE_ENGINE_DEFAULT_DATE_FORMAT)
})

/**
 * @param {string} locale
 * @param {string} messageType
 * @param {string} transportType
 *
 * @returns {string}
 */
function getTemplate (locale, messageType, transportType) {
    // this is template reading method and files are distributed as part of source codes
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const defaultTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${DEFAULT_TEMPLATE_FILE_NAME}`)
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const transportTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${transportType}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)

    if (fs.existsSync(transportTemplatePath)) {
        return transportTemplatePath
    }

    if (fs.existsSync(defaultTemplatePath)) {
        return defaultTemplatePath
    }

    throw new Error(`There is no "${locale}" template for "${messageType}" to send by "${transportType}"`)
}

/**
 * Separated function for email templates, because we have to detect html format
 * @param {string} locale
 * @param {string} messageType
 *
 * @returns {{templatePathText: ?string, templatePathHtml: ?string, templatePathMjml: ?string}}
 */
function getEmailTemplate (locale, messageType) {
    // this is template reading method and files are distributed as part of source codes
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const defaultTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${DEFAULT_TEMPLATE_FILE_NAME}`)
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const emailTextTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${EMAIL_TRANSPORT}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const emailHtmlTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${EMAIL_TRANSPORT}.html.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const emailMjmlTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${EMAIL_TRANSPORT}.mjml.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)

    let templatePathText = null
    let templatePathHtml = null
    let templatePathMjml = null

    if (fs.existsSync(emailTextTemplatePath)) {
        templatePathText = emailTextTemplatePath
    }

    if (fs.existsSync(emailHtmlTemplatePath)) {
        templatePathHtml = emailHtmlTemplatePath
    }

    if (fs.existsSync(emailMjmlTemplatePath)) {
        templatePathMjml = emailMjmlTemplatePath
    }

    if (!templatePathText && !templatePathHtml && !templatePathMjml && fs.existsSync(defaultTemplatePath)) {
        templatePathText = defaultTemplatePath
    }

    if (templatePathText || templatePathHtml || templatePathMjml) return { templatePathText, templatePathHtml, templatePathMjml }

    throw new Error(`There is no "${locale}" template for "${messageType}" to send by "${EMAIL_TRANSPORT}"`)
}

function getDefaultTemplate (locale, messageType) {
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const defaultTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${DEFAULT_TEMPLATE_FILE_NAME}`)

    let templatePath = null
    if (fs.existsSync(defaultTemplatePath)) {
        templatePath = defaultTemplatePath
    }

    return { templatePath }
}

function renderDefaultTemplate (message, locale) {
    const env = {
        serverUrl: SERVER_URL,
    }
    const { type } = message
    const { templatePath } = getDefaultTemplate(locale, type)

    if (templatePath) {
        const messageTranslated = substituteTranslations(message, locale)
        return nunjucks.render(templatePath, { message: messageTranslated, env })
    }
}

function getTelegramTemplate (locale, messageType) {
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const defaultTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${DEFAULT_TEMPLATE_FILE_NAME}`)
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const telegramTextTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${TELEGRAM_TRANSPORT}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const telegramHtmlTemplatePath = path.resolve(__dirname, `${LANG_DIR_RELATED}/${locale}/messages/${messageType}/${TELEGRAM_TRANSPORT}.html.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)

    let templatePathText = null
    let templatePathHtml = null

    if (fs.existsSync(telegramTextTemplatePath)) {
        templatePathText = telegramTextTemplatePath
    }

    if (fs.existsSync(telegramHtmlTemplatePath)) {
        templatePathHtml = telegramHtmlTemplatePath
    }

    if (!templatePathText && !templatePathHtml && fs.existsSync(defaultTemplatePath)) {
        templatePathText = defaultTemplatePath
    }

    if (templatePathText || templatePathHtml) return { templatePathText, templatePathHtml }

    throw new Error(`There is no "${locale}" template for "${messageType}" to send by "${TELEGRAM_TRANSPORT}"`)
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

/**
 * @param {string} messageType
 * @returns {string}
 */
function translationStringKeyForTelegramUrlMessage (messageType) {
    return `notification.messages.${messageType}.${TELEGRAM_TRANSPORT}.urlMessage`
}

function normalizeSMSText (text) {
    return unescape(text).replace(SMS_FORBIDDEN_SYMBOLS_REGEXP, '*')
}

/**
 * Substitutes localized value for item if available.
 * Supports recursive iteration for objects and arrays.
 * @param item
 * @param locale
 * @returns {{}|*}
 */
function substituteTranslations (item, locale) {
    if (isArray(item)) return item.map(itemValue => substituteTranslations(itemValue, locale))
    if (isObject(item)) return translateObjectItems(item, locale)
    
    return getLocalized(locale, item)
}

/**
 * Substitutes localized values for obj keys if key has localization.
 * Correctly handles nested objects & arrays.
 * @param obj
 * @param locale
 * @returns {{}}
 */
function translateObjectItems (obj, locale) {
    const keys = Object.keys(obj)

    function handleItem (res, key) {
        res[key] = substituteTranslations(obj[key], locale)

        return res
    }

    return keys.reduce(handleItem, {})
}

/**
 * Renders message template for Telegram
 */
function telegramRenderer ({ message, env }) {
    const { lang: locale, type, meta } = message
    const { templatePathText, templatePathHtml } = getTelegramTemplate(locale, type)
    const messageTranslated = substituteTranslations(message, locale)
    const ret = {}

    if (templatePathText) {
        ret.text = unescape(nunjucks.render(templatePathText, { message: messageTranslated, env }))
    }

    if (templatePathHtml) {
        ret.html = nunjucks.render(templatePathHtml, { message: messageTranslated, env })
    }

    const text = i18n(translationStringKeyForTelegramUrlMessage(type), { locale, meta: messageTranslated.meta })
    const url = meta?.data?.url

    if (url && text) {
        ret.inlineKeyboard = [[{ text, url }]]
    }

    return ret
}

/**
 * Renders message template for SMS
 * @param message
 * @param env
 * @returns {{text: *}}
 */
function smsRenderer ({ message, env }) {
    const { lang: locale } = message
    const messageTranslated = substituteTranslations(message, locale)

    return {
        text: normalizeSMSText(nunjucks.render(getTemplate(message.lang, message.type, SMS_TRANSPORT), { message: messageTranslated, env })),
    }
}

/**
 * Renders message template for E-Mail
 * @param message
 * @param env
 * @returns {{subject: string}}
 */
function emailRenderer ({ message, env }) {
    const { lang: locale, type } = message
    const { templatePathText, templatePathHtml, templatePathMjml } = getEmailTemplate(locale, type)
    const messageTranslated = substituteTranslations(message, locale)
    const ret = {
        subject: i18n(translationStringKeyForEmailSubject(type), { locale, meta: messageTranslated.meta }),
    }

    if (templatePathText) {
        // For text emails we unescape email message to prevent HTML entities in email body
        // See https://lodash.com/docs/4.17.15#unescape
        // &amp;, &lt;, &gt;, &quot;, and &#39; will be replaced to corresponding characters
        ret.text = unescape(nunjucks.render(templatePathText, { message: messageTranslated, env }))
    }

    if (templatePathHtml) {
        ret.html = nunjucks.render(templatePathHtml, { message: messageTranslated, env })
    }

    if (templatePathMjml) {
        ret.html = mjml2html(nunjucks.render(templatePathMjml, { message: messageTranslated, env })).html
    }

    return ret
}

/**
 * Renders message template for push
 * @param message
 * @param env
 * @returns {{notification: {title: string, body}, data: {[p: string]: *}}}
 */
function pushRenderer ({ message, env }) {
    const { id: notificationId, lang: locale, type, createdAt } = message
    const messageTranslated = substituteTranslations(message, locale)

    const renderedTitle = i18n(translationStringKeyForPushTitle(type), { locale, meta: messageTranslated.meta })

    // For push messages emails we unescape message to prevent HTML entities in push body
    // See https://lodash.com/docs/4.17.15#unescape
    // &amp;, &lt;, &gt;, &quot;, and &#39; will be replaced to corresponding characters
    const renderedBody =  unescape(nunjucks.render(getTemplate(locale, type, PUSH_TRANSPORT), { message: messageTranslated, env  }))

    return {
        notification: {
            title: renderedTitle,
            body: renderedBody,
        },
        data: { ...get(message, ['meta', 'data'], {}), notificationId, type, messageCreatedAt: createdAt },
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

const TRANSPORT_RENDERER_KEYS = Object.keys(MESSAGE_TRANSPORTS_RENDERERS)

async function renderTemplate (transport, message) {
    if (!MESSAGE_TRANSPORTS.includes(transport)) throw new Error('unexpected transport argument')
    if (!TRANSPORT_RENDERER_KEYS.includes(transport)) throw new Error(`No renderer for ${transport} messages`)

    /**
     * @type {MessageTemplateEnvironment}
     */
    const env = {
        serverUrl: SERVER_URL,
        socialMediaLinks: SOCIAL_MEDIA_LINKS,
        supportEmail: SUPPORT_EMAIL,
        landingUrl: LANDING_URL,
    }
    const renderMessage = MESSAGE_TRANSPORTS_RENDERERS[transport]

    return renderMessage({ message, env })
}

module.exports = {
    renderDefaultTemplate,
    renderTemplate,
    translationStringKeyForEmailSubject,
    translationStringKeyForPushTitle,
    substituteTranslations,
    templateEngine: nunjucks,
    TEMPLATE_ENGINE_DEFAULT_DATE_FORMAT,
}
