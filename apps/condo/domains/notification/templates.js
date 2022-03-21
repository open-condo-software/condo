const conf = require('@core/config')
const dayjs = require('dayjs')
const get = require('lodash/get')

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
    DEVELOPER_IMPORTANT_NOTE_TYPE,
    CUSTOMER_IMPORTANT_NOTE_TYPE,
    MESSAGE_FORWARDED_TO_SUPPORT,
} = require('./constants/constants')

async function renderTemplate (transport, message) {
    if (!MESSAGE_TRANSPORTS.includes(transport)) throw new Error('unexpected transport argument')

    // TODO(pahaz): we need to decide where to store templates! HArDCODE!
    // TODO(pahaz): write the logic here!
    //  1) we should find message template by TYPE + LANG
    //  2) we should render the template and return transport context

    const serverUrl = conf.SERVER_URL

    if (message.type === INVITE_NEW_EMPLOYEE_MESSAGE_TYPE) {
        const { organizationName, inviteCode } = message.meta

        if (message.lang === EN_LOCALE) {
            return {
                subject: 'You are invited to join organization as employee',
                text: `Organization "${organizationName}" invited you as employee.\n` +
                    `Click to the link to join: ${serverUrl}/auth/invite/${inviteCode}`,
            }
        } else if (message.lang === RU_LOCALE) {
            return {
                subject: 'Вас пригласили присоединиться к организации в качестве сотрудника',
                text: `Администратор организации "${organizationName}" приглашает вас в качестве сотрудника.\n` +
                    `Перейдите по ссылке, чтобы присоединиться: ${serverUrl}/auth/invite/${inviteCode}`,
            }
        }
    }

    if (message.type === DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE) {
        const { organizationName } = message.meta
        if (transport === EMAIL_TRANSPORT) {
            if (message.lang === EN_LOCALE) {
                return {
                    subject: 'You are invited to join organization as employee',
                    text: `Organization "${organizationName}" invited you as employee.\n` +
                        `Click to the link to join: ${serverUrl}/auth/signin`,
                }
            } else if (message.lang === RU_LOCALE) {
                return {
                    subject: 'Вас пригласили присоединиться к организации в качестве сотрудника',
                    text: `Администратор организации "${organizationName}" приглашает вас в качестве сотрудника.\n` +
                        `Перейдите по ссылке, чтобы присоединиться: ${serverUrl}/auth/signin`,
                }
            }
        } else if (transport === SMS_TRANSPORT) {
            if (message.lang === EN_LOCALE) {
                return {
                    text: `Organization "${organizationName}" invited you as employee.\n` +
                        `Click to the link to join: ${serverUrl}/auth/signin`,
                }
            } else if (message.lang === RU_LOCALE) {
                return {
                    text: `Организация "${organizationName}" приглашает вас в качестве сотрудника.\n` +
                        `Перейдите по ссылке, чтобы присоединиться: ${serverUrl}/auth/signin`,
                }
            }
        }
    }

    if (message.type === REGISTER_NEW_USER_MESSAGE_TYPE) {
        const { userPhone, userPassword } = message.meta
        if (transport === EMAIL_TRANSPORT) {
            if (message.lang === EN_LOCALE) {
                return {
                    subject: 'Your access data to doma.ai service.',
                    text: `
                    Phone: ${userPhone}
                    Password: ${userPassword}

                    Please follow link: ${serverUrl}/auth/signin
                `,
                }
            } else if (message.lang === RU_LOCALE) {
                return {
                    subject: 'Ваши данные для доступа к сервису doma.ai.',
                    text: `
                    Номер телефона: ${userPhone}
                    Пароль: ${userPassword}

                    Ссылка для авторизации: ${serverUrl}/auth/signin
                `,
                }
            }
        } else if (transport === SMS_TRANSPORT) {
            if (message.lang === EN_LOCALE) {
                return {
                    text: `
                    Phone: ${userPhone}
                    Password: ${userPassword}
                    -> ${serverUrl}
                `,
                }
            } else if (message.lang === RU_LOCALE) {
                return {
                    text: `
                    Тел: ${userPhone}
                    Пароль: ${userPassword}
                    -> ${serverUrl}
                `,
                }
            }
        }
    }

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

    if (message.type === MESSAGE_FORWARDED_TO_SUPPORT) {
        const { emailFrom, meta } = message
        const { dv, text, os, appVersion, organizationsData = [] } = meta

        return {
            subject: 'Обращение из мобильного приложения',
            text: `
                Система: ${os}
                Версия приложения: ${appVersion}
                Email: ${emailFrom ? emailFrom : 'не указан'}
                Сообщение: ${text}
                УК: ${organizationsData.length === 0 ? 'нет' : organizationsData.map(({ name, inn }) => `
                  - ${name}. ИНН: ${inn}`).join('')}
            `,
        }
    }

    throw new Error('unknown template or lang')
}

module.exports = {
    renderTemplate,
}
