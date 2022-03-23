const conf = require('@core/config')
const dayjs = require('dayjs')
const { get } = require('lodash')
const Nunjucks = require('nunjucks')
const path = require('path')
const fs = require('fs')

const { RU_LOCALE, EN_LOCALE, LOCALES } = require('@condo/domains/common/constants/locale')

const {
    INVITE_NEW_EMPLOYEE_MESSAGE_TYPE,
    DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE,
    MESSAGE_TRANSPORTS,
    REGISTER_NEW_USER_MESSAGE_TYPE,
    RESET_PASSWORD_MESSAGE_TYPE,
    SMS_VERIFY_CODE_MESSAGE_TYPE,
    SHARE_TICKET_MESSAGE_TYPE,
    EMAIL_TRANSPORT,
    SMS_TRANSPORT,
    TELEGRAM_TRANSPORT,
    PUSH_TRANSPORT,
    DEVELOPER_IMPORTANT_NOTE_TYPE,
    CUSTOMER_IMPORTANT_NOTE_TYPE,
    MESSAGE_FORWARDED_TO_SUPPORT,
    TICKET_ASSIGNEE_CONNECTED_TYPE,
    TICKET_EXECUTOR_CONNECTED_TYPE,
    DEFAULT_TEMPLATE_FILE_NAME,
    DEFAULT_TEMPLATE_FILE_EXTENSION,
} = require('./constants/constants')
const { i18n } = require('@condo/domains/common/utils/localesLoader')

const {
    getTicketAssigneeConnectedMessage,
    getTicketExecutorConnectedMessage,
} = require('./ticketTemplates')

const langDirRelated = '../../lang'

const nunjucks = new Nunjucks.Environment(new Nunjucks.FileSystemLoader(path.resolve(__dirname, langDirRelated)))
nunjucks.addFilter('dateFormat', function (dateStr, locale, format) {
    return dayjs(dateStr).locale(LOCALES[locale || conf.DEFAULT_LOCALE]).format(format || 'D MMMM YYYY')
})

/**
 * @param {string} lang
 * @param {string} messageType
 * @param {string} transportType
 *
 * @returns {string}
 */
function getTemplate (lang, messageType, transportType) {
    const defaultTemplatePath = path.resolve(__dirname, `${langDirRelated}/${lang}/messages/${messageType}/${DEFAULT_TEMPLATE_FILE_NAME}`)
    const transportTemplatePath = path.resolve(__dirname, `${langDirRelated}/${lang}/messages/${messageType}/${transportType}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)

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
 * @returns {{isHtml: boolean, templatePath: string}}
 */
function getEmailTemplate (lang, messageType) {
    const defaultTemplatePath = path.resolve(__dirname, `${langDirRelated}/${lang}/messages/${messageType}/${DEFAULT_TEMPLATE_FILE_NAME}`)
    const emailTextTemplatePath = path.resolve(__dirname, `${langDirRelated}/${lang}/messages/${messageType}/${EMAIL_TRANSPORT}.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)
    const emailHtmlTemplatePath = path.resolve(__dirname, `${langDirRelated}/${lang}/messages/${messageType}/${EMAIL_TRANSPORT}.html.${DEFAULT_TEMPLATE_FILE_EXTENSION}`)

    let isHtml = false
    let templatePath = null

    if (fs.existsSync(emailTextTemplatePath)) {
        templatePath = emailTextTemplatePath
    } else if (fs.existsSync(emailHtmlTemplatePath)) {
        isHtml = true
        templatePath = emailHtmlTemplatePath
    } else if (fs.existsSync(defaultTemplatePath)) {
        templatePath = defaultTemplatePath
    }

    if (templatePath) {
        return { templatePath, isHtml }
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
    [SMS_TRANSPORT]: function ({ message, env }) {
        return {
            text: nunjucks.render(getTemplate(message.lang, message.type, SMS_TRANSPORT), { message, env }),
        }
    },
    [EMAIL_TRANSPORT]: function ({ message, env }) {
        const { lang, meta } = message
        const { templatePath, isHtml } = getEmailTemplate(message.lang, message.type)
        return {
            subject: i18n(translationStringKeyForEmailSubject(message.type), { lang, meta }),
            [isHtml ? 'html' : 'text']: nunjucks.render(templatePath, { message, env }),
        }
    },
    [TELEGRAM_TRANSPORT]: function ({ message, env }) {
        throw new Error('No Telegram transport yet')
    },
    [PUSH_TRANSPORT]: function ({ message, env }) {
        const { lang, meta } = message
        return {
            notification: {
                title: i18n(translationStringKeyForPushTitle(message.type), { lang, meta }),
                body: nunjucks.render(getTemplate(message.lang, message.type, PUSH_TRANSPORT), { message, env }),
            },
            data: get(message, ['meta', 'pushData'], null),
            userId: get(message, ['meta', 'userId'], null),
        }
    },
}

async function renderTemplate (transport, message) {
    if (!MESSAGE_TRANSPORTS.includes(transport)) {
        throw new Error('unexpected transport argument')
    }

    if (!Object.keys(MESSAGE_TRANSPORTS_RENDERERS).includes(transport)) {
        throw new Error(`No renderer for ${transport} messages`)
    }

    // TODO(pahaz): we need to decide where to store templates! HArDCODE!
    // TODO(pahaz): write the logic here!
    //  1) we should find message template by TYPE + LANG
    //  2) we should render the template and return transport context

    const serverUrl = conf.SERVER_URL

    /**
     * @type {MessageTemplateEnvironment}
     */
    const env = { serverUrl }

    const renderMessage = MESSAGE_TRANSPORTS_RENDERERS[transport]
    return renderMessage({ message, env })

    if (message.type === SHARE_TICKET_MESSAGE_TYPE) {
        const { ticketNumber, date, details, id } = message.meta

        if (message.lang === EN_LOCALE) {
            return {
                subject: `Ticket №${ticketNumber}`,
                html: `
                    <html style="fmargin: 0; font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif; font-size: 22px; font-weight: 400; line-height: 32px; text-align: left;">
                        <body style="margin: 0; font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif; font-size: 22px; font-weight: 400; line-height: 32px; text-align: left;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0; padding:0;font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif; font-size: 16px;">
                                <tr>
                                    <td width="10%" align="left"><b style="font-size: 16px;">DOMA.ai</b></td>
                                    <td width="80%">&nbsp;</td>
                                    <td width="10%" align="right"><b style="font-size: 16px;">CONTROL ROOM</b></td>
                                </tr>
                            </table>
                            <p style="font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif; font-size: 22px; font-weight: 400; line-height: 32px; text-align: left;">Hello!<br />
                            Ticket #${ticketNumber} dated ${dayjs(date).locale(LOCALES[EN_LOCALE]).format('D MMMM YYYY')} has been shared with you.<br />
                            The text of the ticket: "${details}"</p>
                            <p>&nbsp;</p>
                            <div><!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${serverUrl}/ticket/${id}" style="height:40px;v-text-anchor:middle;width:330px;" arcsize="10%" stroke="f" fill="t">
                                <v:fill type="tile" src="" color="#4CD174" />
                                <w:anchorlock/>
                                <center style="color:#ffffff;font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif;font-size:16px;font-weight:bold;">To Doma.ai ticket's card</center>
                            </v:roundrect>
                            <![endif]--><a href="${serverUrl}/ticket/${id}" style="background-color:#4CD174;border-radius:4px;color:#ffffff;display:inline-block;font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif;font-size:16px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:330px;-webkit-text-size-adjust:none;mso-hide:all;">To Doma.ai ticket's card</a></div>
                        </body>
                    </html>
                `,
            }
        } else if (message.lang === RU_LOCALE) {
            return {
                subject: `Заявка №${ticketNumber}`,
                html: `
                    <html style="fmargin: 0; font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif; font-size: 22px; font-weight: 400; line-height: 32px; text-align: left;">
                        <body style="margin: 0; font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif; font-size: 22px; font-weight: 400; line-height: 32px; text-align: left;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0; padding:0">
                                <tr>
                                    <td width="10%" align="left"><b style="font-size: 16px;">DOMA.ai</b></td>
                                    <td width="80%">&nbsp;</td>
                                    <td width="10%" align="right"><b style="font-size: 16px;">ДИСПЕТЧЕРСКАЯ</b></td>
                                </tr>
                            </table>
                            <p style="font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif; font-size: 22px; font-weight: 400; line-height: 32px; text-align: left;">Добрый день!<br />
                            С вами поделились заявкой №${ticketNumber} от ${dayjs(date).locale(LOCALES[RU_LOCALE]).format('D MMMM YYYY')}.<br />
                            Текст заявки: «${details}»</p>
                            <p>&nbsp;</p>
                            <div><!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${serverUrl}/ticket/${id}" style="height:40px;v-text-anchor:middle;width:330px;" arcsize="10%" stroke="f" fill="t">
                                <v:fill type="tile" src="" color="#4CD174" />
                                <w:anchorlock/>
                                <center style="color:#ffffff;font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif;font-size:16px;font-weight:bold;">Перейти в карточку заявки в Doma.ai</center>
                            </v:roundrect>
                            <![endif]--><a href="${serverUrl}/ticket/${id}" style="background-color:#4CD174;border-radius:4px;color:#ffffff;display:inline-block;font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif;font-size:16px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:330px;-webkit-text-size-adjust:none;mso-hide:all;">Перейти в карточку заявки в Doma.ai</a></div>
                        </body>
                    </html>
                `,
            }
        }
    }

    if (message.type === RESET_PASSWORD_MESSAGE_TYPE) {
        const { token } = message.meta
        if (transport === EMAIL_TRANSPORT) {
            if (message.lang === 'en') {
                return {
                    subject: 'You are trying to reset password',
                    text: `Click to the link to set new password: ${serverUrl}/auth/change-password?token=${token}`,
                }
            } else if (message.lang === 'ru') {
                return {
                    subject: 'Восстановление пароля',
                    text: `
                    Добрый день! \n
                    Чтобы задать новый пароль к платформе Doma.ai, вам просто нужно перейти по сслыке.\n
                    ${serverUrl}/auth/change-password?token=${token}
                `,
                }
            }
        } else if (transport === SMS_TRANSPORT) {
            if (message.lang === 'en') {
                return {
                    text: `Click to the link to set new password: ${serverUrl}/auth/change-password?token=${token}`,
                }
            } else if (message.lang === 'ru') {
                return {
                    text: `
                        Перейдите по сслыке для изменения пароля: ${serverUrl}/auth/change-password?token=${token}
                    `,
                }
            }
        }
    }

    if (message.type === SMS_VERIFY_CODE_MESSAGE_TYPE) {
        const { smsCode } = message.meta
        if (message.lang === 'en') {
            return {
                subject: 'Verify code',
                text: `Code: ${smsCode}`,
            }
        } else if (message.lang === 'ru') {
            return {
                subject: 'Код',
                text: `Код: ${smsCode}`,
            }
        }
    }

    if (message.type === DEVELOPER_IMPORTANT_NOTE_TYPE) {
        const { data, type } = message.meta
        return {
            subject: String(type),
            text: JSON.stringify(data),
        }
    }

    if (message.type === CUSTOMER_IMPORTANT_NOTE_TYPE) {
        const { data } = message.meta

        return {
            subject: 'Новая организация. (СББОЛ)',
            text: `
                Название: ${get(data, ['organization', 'name'])},
                ИНН: ${get(data, ['organization', 'meta', 'inn'])},
            `,
        }
    }

    if (message.type === TICKET_ASSIGNEE_CONNECTED_TYPE) {
        return getTicketAssigneeConnectedMessage(message, transport)
    }

    if (message.type === TICKET_EXECUTOR_CONNECTED_TYPE) {
        return getTicketExecutorConnectedMessage(message, transport)
    }

    throw new Error('unknown template or lang')
}

module.exports = {
    renderTemplate,
    getEmailTemplate,
    translationStringKeyForEmailSubject,
    translationStringKeyForPushTitle,
}
