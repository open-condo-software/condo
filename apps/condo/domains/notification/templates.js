const dayjs = require('dayjs')
const get = require('lodash/get')
const isFunction = require('lodash/isFunction')
const isEmpty = require('lodash/isEmpty')

const conf = require('@core/config')

const { RU_LOCALE, EN_LOCALE, LOCALES } = require('@condo/domains/common/constants/locale')

const {
    MESSAGE_TYPES,
    EMAIL_TRANSPORT,
    SMS_TRANSPORT,
    PUSH_TRANSPORT,
    MESSAGE_TRANSPORTS,
    INVITE_NEW_EMPLOYEE_MESSAGE_TYPE,
    DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE,
    REGISTER_NEW_USER_MESSAGE_TYPE,
    RESET_PASSWORD_MESSAGE_TYPE,
    SMS_VERIFY_CODE_MESSAGE_TYPE,
    SHARE_TICKET_MESSAGE_TYPE,
    DEVELOPER_IMPORTANT_NOTE_TYPE,
    CUSTOMER_IMPORTANT_NOTE_TYPE,
    MESSAGE_FORWARDED_TO_SUPPORT_TYPE,
    TICKET_ASSIGNEE_CONNECTED_TYPE,
    TICKET_EXECUTOR_CONNECTED_TYPE,
    TICKET_STATUS_CHANGED_TYPE,
} = require('./constants/constants')

const SERVER_URL = conf.SERVER_URL

const getInviteNewEmployeeMessage = (message) => {
    const { organizationName, inviteCode } = message.meta

    if (message.lang === EN_LOCALE) {
        return {
            subject: 'You are invited to join organization as employee',
            text: `Organization "${organizationName}" invited you as employee.\n` +
                `Click to the link to join: ${SERVER_URL}/auth/invite/${inviteCode}`,
        }
    }

    if (message.lang === RU_LOCALE) {
        return {
            subject: 'Вас пригласили присоединиться к организации в качестве сотрудника',
            text: `Администратор организации "${organizationName}" приглашает вас в качестве сотрудника.\n` +
                `Перейдите по ссылке, чтобы присоединиться: ${SERVER_URL}/auth/invite/${inviteCode}`,
        }
    }
}

const getDirtyInviteNewEmployeeMessage = (message, transport) => {
    const { organizationName } = message.meta
    if (transport === EMAIL_TRANSPORT) {
        if (message.lang === EN_LOCALE) {
            return {
                subject: 'You are invited to join organization as employee',
                text: `Organization "${organizationName}" invited you as employee.\n` +
                    `Click to the link to join: ${SERVER_URL}/auth/signin`,
            }
        }

        if (message.lang === RU_LOCALE) {
            return {
                subject: 'Вас пригласили присоединиться к организации в качестве сотрудника',
                text: `Администратор организации "${organizationName}" приглашает вас в качестве сотрудника.\n` +
                    `Перейдите по ссылке, чтобы присоединиться: ${SERVER_URL}/auth/signin`,
            }
        }
    }

    if (transport === SMS_TRANSPORT) {
        if (message.lang === EN_LOCALE) {
            return {
                text: `Organization "${organizationName}" invited you as employee.\n` +
                    `Click to the link to join: ${SERVER_URL}/auth/signin`,
            }
        }

        if (message.lang === RU_LOCALE) {
            return {
                text: `Организация "${organizationName}" приглашает вас в качестве сотрудника.\n` +
                    `Перейдите по ссылке, чтобы присоединиться: ${SERVER_URL}/auth/signin`,
            }
        }
    }
}

const getRegisterNewUserMessage = (message, transport) => {
    const { userPhone, userPassword } = message.meta

    if (transport === EMAIL_TRANSPORT) {
        if (message.lang === EN_LOCALE) {
            return {
                subject: 'Your access data to doma.ai service.',
                text: `
                    Phone: ${userPhone}
                    Password: ${userPassword}

                    Please follow link: ${SERVER_URL}/auth/signin
                `,
            }
        }

        if (message.lang === RU_LOCALE) {
            return {
                subject: 'Ваши данные для доступа к сервису doma.ai.',
                text: `
                    Номер телефона: ${userPhone}
                    Пароль: ${userPassword}

                    Ссылка для авторизации: ${SERVER_URL}/auth/signin
                `,
            }
        }
    }

    if (transport === SMS_TRANSPORT) {
        if (message.lang === EN_LOCALE) {
            return {
                text: `
                    Phone: ${userPhone}
                    Password: ${userPassword}
                    -> ${SERVER_URL}
                `,
            }
        }

        if (message.lang === RU_LOCALE) {
            return {
                text: `
                    Тел: ${userPhone}
                    Пароль: ${userPassword}
                    -> ${SERVER_URL}
                `,
            }
        }
    }
}

const getShareTicketMessage = (message) => {
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
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${SERVER_URL}/ticket/${id}" style="height:40px;v-text-anchor:middle;width:330px;" arcsize="10%" stroke="f" fill="t">
                                <v:fill type="tile" src="" color="#4CD174" />
                                <w:anchorlock/>
                                <center style="color:#ffffff;font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif;font-size:16px;font-weight:bold;">To Doma.ai ticket's card</center>
                            </v:roundrect>
                            <![endif]--><a href="${SERVER_URL}/ticket/${id}" style="background-color:#4CD174;border-radius:4px;color:#ffffff;display:inline-block;font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif;font-size:16px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:330px;-webkit-text-size-adjust:none;mso-hide:all;">To Doma.ai ticket's card</a></div>
                        </body>
                    </html>
                `,
        }
    }

    if (message.lang === RU_LOCALE) {
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
                            С вами поделились заявкой №${ticketNumber} от ${dayjs(date).locale(LOCALES[RU_LOCALE]).format('D MMMM YYYY')})}.<br />
                            Текст заявки: «${details}»</p>
                            <p>&nbsp;</p>
                            <div><!--[if mso]>
                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${SERVER_URL}/ticket/${id}" style="height:40px;v-text-anchor:middle;width:330px;" arcsize="10%" stroke="f" fill="t">
                                <v:fill type="tile" src="" color="#4CD174" />
                                <w:anchorlock/>
                                <center style="color:#ffffff;font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif;font-size:16px;font-weight:bold;">Перейти в карточку заявки в Doma.ai</center>
                            </v:roundrect>
                            <![endif]--><a href="${SERVER_URL}/ticket/${id}" style="background-color:#4CD174;border-radius:4px;color:#ffffff;display:inline-block;font-family: Roboto, Arial, 'Nimbus Sans L', Helvetica, sans-serif;font-size:16px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:330px;-webkit-text-size-adjust:none;mso-hide:all;">Перейти в карточку заявки в Doma.ai</a></div>
                        </body>
                    </html>
                `,
        }
    }
}

const getResetPasswordMessage = (message, transport) => {
    const { token } = message.meta

    if (transport === EMAIL_TRANSPORT) {
        if (message.lang === EN_LOCALE) {
            return {
                subject: 'You are trying to reset password',
                text: `Click to the link to set new password: ${SERVER_URL}/auth/change-password?token=${token}`,
            }
        }

        if (message.lang === RU_LOCALE) {
            return {
                subject: 'Восстановление пароля',
                text: `
                    Добрый день! \n
                    Чтобы задать новый пароль к платформе Doma.ai, вам просто нужно перейти по сслыке.\n
                    ${SERVER_URL}/auth/change-password?token=${token}
                `,
            }
        }
    }

    if (transport === SMS_TRANSPORT) {
        if (message.lang === EN_LOCALE) {
            return {
                text: `Click to the link to set new password: ${SERVER_URL}/auth/change-password?token=${token}`,
            }
        }

        if (message.lang === RU_LOCALE) {
            return {
                text: `
                        Перейдите по сслыке для изменения пароля: ${SERVER_URL}/auth/change-password?token=${token}
                    `,
            }
        }
    }
}

const getSmsVerifyCodeMessage = (message) => {
    const { smsCode } = message.meta

    if (message.lang === EN_LOCALE) {
        return {
            subject: 'Verify code',
            text: `Code: ${smsCode}`,
        }
    }

    if (message.lang === RU_LOCALE) {
        return {
            subject: 'Код',
            text: `Код: ${smsCode}`,
        }
    }
}

/**
 * Looks like we shouldn't send such messages through SMS (could be very expensive)
 * @param message
 * @returns {{subject: string, text: string}}
 */
const getDeveloperImportantNote = (message, transport) => {
    const { data, type } = message.meta

    if (transport === EMAIL_TRANSPORT) {
        return {
            subject: String(type),
            text: JSON.stringify(data),
        }
    }
}

const getCustomerImportantNote = (message) => {
    const { data } = message.meta

    return {
        subject: 'Новая организация. (СББОЛ)',
        text: `
                Название: ${get(data, ['organization', 'name'])},
                ИНН: ${get(data, ['organization', 'meta', 'inn'])},
            `,
    }
}

const getTicketAssigneeConnectedMessagePush = (message) => {
    const { id: notificationId } = message
    const { ticketId, ticketNumber, userId } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                notification: {
                    title: `Ticket #${ticketNumber}`,
                    body: `You were assigned as responsible of ticket #${ticketNumber}`,
                },
                data: { ticketId, notificationId },
                userId,
            }

        case RU_LOCALE:
            return {
                notification: {
                    title: `Заявка №${ticketNumber}`,
                    body: `Вы назначены ответственным(-ой) по заявке №${ticketNumber}`,
                },
                data: { ticketId, notificationId },
                userId,
            }
    }
}

const getTicketAssigneeConnectedMessageSms = (message) => {
    const { ticketNumber } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                text: `You were assigned as responsible of ticket #${ticketNumber}`,
            }

        case RU_LOCALE:
            return {
                text: `Вы назначены ответственным(-ой) по заявке №${ticketNumber}`,
            }
    }
}

const getTicketAssigneeConnectedMessageEmail = (message) => {
    const { ticketId, ticketNumber } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                subject: `You were assigned as responsible of ticket #${ticketNumber}`,
                text: `Please follow the link to view the ticket: ${SERVER_URL}/ticket/${ticketId}`,
            }

        case RU_LOCALE:
            return {
                subject: `Вы назначены ответственным(-ой) по заявке №${ticketNumber}`,
                text: `Ознакомиться с заявкой можнжо по ссылке: ${SERVER_URL}/ticket/${ticketId}`,
            }
    }
}

const getTicketAssigneeConnectedMessage = (message, transport) => {
    switch (transport) {
        case PUSH_TRANSPORT: return getTicketAssigneeConnectedMessagePush(message)
        case EMAIL_TRANSPORT: return getTicketAssigneeConnectedMessageEmail(message)
        case SMS_TRANSPORT: return getTicketAssigneeConnectedMessageSms(message)
    }
}


const getTicketExecutorConnectedMessagePush = (message) => {
    const { id: notificationId } = message
    const { ticketId, ticketNumber, userId } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                notification: {
                    title: `Ticket #${ticketNumber}`,
                    body: `You were assigned as executor of ticket #${ticketNumber}`,
                    userId,
                },
                data: { ticketId, notificationId },
            }

        case RU_LOCALE:
            return {
                notification: {
                    title: `Заявка №${ticketNumber}`,
                    body: `Вы назначены исполнителем(-ницей) по заявке №${ticketNumber}`,
                    userId,
                },
                data: { ticketId, notificationId },
            }
    }
}

const getTicketExecutorConnectedMessageSms = (message) => {
    const { ticketNumber } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                text: `You were assigned as executor of ticket #${ticketNumber}`,
            }

        case RU_LOCALE:
            return {
                text: `Вы назначены исполнителем(-ницей) по заявке №${ticketNumber}`,
            }
    }
}

const getTicketExecutorConnectedMessageEmail = (message) => {
    const { ticketId, ticketNumber } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                subject: `You were assigned as executor of ticket #${ticketNumber}`,
                text: `Please follow the link to view the ticket: ${SERVER_URL}/ticket/${ticketId}`,
            }

        case RU_LOCALE:
            return {
                subject: `Вы назначены исполнителем(-ницей) по заявке №${ticketNumber}`,
                text: `Ознакомиться с заявкой можнжо по ссылке: ${SERVER_URL}/ticket/${ticketId}`,
            }
    }
}

const getTicketExecutorConnectedMessage = (message, transport) => {
    switch (transport) {
        case PUSH_TRANSPORT: return getTicketExecutorConnectedMessagePush(message)
        case EMAIL_TRANSPORT: return getTicketExecutorConnectedMessageEmail(message)
        case SMS_TRANSPORT: return getTicketExecutorConnectedMessageSms(message)
    }
}

const getTicketStatusChangedMessagePush = (message) => {
    const { ticketId, ticketNumber, statusName } = get(message, 'meta', {})

    // TODO: localization of status name
    switch (message.lang) {
        case EN_LOCALE:
            return {
                notification: `Ticket #${ticketNumber} status changed to ${statusName}`,
                data: { ticketId },
            }

        case RU_LOCALE:
            return {
                notification: `Статус заявки №${ticketNumber} изменен на ${statusName}`,
                data: { ticketId },
            }
    }
}

const getTicketStatusChangedMessageSms = (message) => {
    const { ticketNumber, statusName } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                text: `Ticket #${ticketNumber} status changed to ${statusName}`,
            }

        case RU_LOCALE:
            return {
                text: `Статус заявки №${ticketNumber} изменен на ${statusName}`,
            }
    }
}

const getTicketStatusChangedMessageEmail = (message) => {
    const { ticketId, ticketNumber, statusName } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                subject: `Ticket #${ticketNumber} status changed to ${statusName}`,
                text: `Please follow the link to view the ticket: ${SERVER_URL}/ticket/${ticketId}`,
            }

        case RU_LOCALE:
            return {
                subject: `Статус заявки №${ticketNumber} изменен на ${statusName}`,
                text: `Ознакомиться с заявкой можнжо по ссылке: ${SERVER_URL}/ticket/${ticketId}`,
            }
    }
}

const getTicketStatusChangedMessage = (message, transport) => {
    switch (transport) {
        case PUSH_TRANSPORT: return getTicketStatusChangedMessagePush(message)
        case EMAIL_TRANSPORT: return getTicketStatusChangedMessageEmail(message)
        case SMS_TRANSPORT: return getTicketStatusChangedMessageSms(message)
    }
}

const getForwardedToSupportMessage = (message) => {
    const { emailFrom, meta } = message
    const { text, os, appVersion, organizationsData = [] } = meta

    switch (message.lang) {
        case EN_LOCALE: {
            const org = isEmpty(organizationsData)
                ? 'нет'
                : organizationsData.map(({ name, inn }) => `- ${name}. ИНН: ${inn}`).join('')

            return {
                subject: 'Ticket from mobile application',
                text: `
                        OS: ${os}
                        Application version: ${appVersion}
                        Email: ${emailFrom ? emailFrom : 'не указан'}
                        Message: ${text}
                        Organization: ${org}
                    `,
            }
        }

        case RU_LOCALE: {
            const org = isEmpty(organizationsData)
                ? 'no'
                : organizationsData.map(({ name, inn }) => `- ${name}. TIN: ${inn}`).join('')

            return {
                subject: 'Обращение из мобильного приложения',
                text: `
                        Система: ${os}
                        Версия приложения: ${appVersion}
                        Email: ${emailFrom ? emailFrom : 'не указан'}
                        Сообщение: ${text}
                        УК: ${org}
                    `,
            }
        }
    }
}

const MESSAGE_TEMPLATE_BY_TYPE = {
    [INVITE_NEW_EMPLOYEE_MESSAGE_TYPE]: getInviteNewEmployeeMessage,
    [DIRTY_INVITE_NEW_EMPLOYEE_MESSAGE_TYPE]: getDirtyInviteNewEmployeeMessage,
    [REGISTER_NEW_USER_MESSAGE_TYPE]: getRegisterNewUserMessage,
    [SHARE_TICKET_MESSAGE_TYPE]: getShareTicketMessage,
    [RESET_PASSWORD_MESSAGE_TYPE]: getResetPasswordMessage,
    [SMS_VERIFY_CODE_MESSAGE_TYPE]: getSmsVerifyCodeMessage,
    [DEVELOPER_IMPORTANT_NOTE_TYPE]: getDeveloperImportantNote,
    [CUSTOMER_IMPORTANT_NOTE_TYPE]: getCustomerImportantNote,
    [TICKET_ASSIGNEE_CONNECTED_TYPE]: getTicketAssigneeConnectedMessage,
    [TICKET_EXECUTOR_CONNECTED_TYPE]: getTicketExecutorConnectedMessage,
    [TICKET_STATUS_CHANGED_TYPE]: getTicketStatusChangedMessage,
    [MESSAGE_FORWARDED_TO_SUPPORT_TYPE]: getForwardedToSupportMessage,
}

/**
 * Check if all declared event types have template function available and set within MESSAGE_TEMPLATE_BY_TYPE
 */
MESSAGE_TYPES.forEach(type => {
    if (!MESSAGE_TEMPLATE_BY_TYPE[type]) throw new Error(`Event of type ${type} doesn't have template function declared`)
})

async function renderTemplate (transport, message) {
    if (!MESSAGE_TRANSPORTS.includes(transport)) throw new Error('unexpected transport argument')

    // TODO(pahaz): we need to decide where to store templates! HArDCODE!
    // TODO(pahaz): write the logic here!
    //  1) we should find message template by TYPE + LANG
    //  2) we should render the template and return transport context

    const getMessage = MESSAGE_TEMPLATE_BY_TYPE[message.type]

    if (isFunction(getMessage)) {
        const result = getMessage(message, transport)

        // This line would fire only if we have declared function for message.type and function has returned something.
        // If it doesn't return anything, that means requirements weren't met inside, like transport + lang combination.
        if (result) return { ...result, notificationId: message.id }
    }

    // if (message.type === MESSAGE_FORWARDED_TO_SUPPORT_TYPE) {
    //     const { emailFrom, meta } = message
    //     const { dv, text, os, appVersion, organizationsData = [] } = meta
    //
    //     return {
    //         subject: 'Обращение из мобильного приложения',
    //         text: `
    //             Система: ${os}
    //             Версия приложения: ${appVersion}
    //             Email: ${emailFrom ? emailFrom : 'не указан'}
    //             Сообщение: ${text}
    //             УК: ${organizationsData.length === 0 ? 'нет' : organizationsData.map(({ name, inn }) => `
    //               - ${name}. ИНН: ${inn}`).join('')}
    //         `,
    //     }
    // }

    throw new Error('unknown template or lang')
}

module.exports = {
    renderTemplate,
}
