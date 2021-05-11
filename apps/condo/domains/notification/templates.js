const conf = require('@core/config')
const { RU_LOCALE, EN_LOCALE } = require('@condo/domains/common/constants/locale')

const { INVITE_NEW_EMPLOYEE_MESSAGE_TYPE, MESSAGE_TRANSPORTS, REGISTER_NEW_USER_MESSAGE_TYPE } = require('./constants')

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

    if (message.type === REGISTER_NEW_USER_MESSAGE_TYPE) {
        const { userPhone, userPassword } = message.meta

        if (message.lang === 'en') {
            return {
                subject: 'Your access data to doma.ai service.',
                text: `
                    Phone: ${userPhone}
                    Password: ${userPassword}
                    
                    Please follow link: ${serverUrl}/auth/signin
                `,
            }
        } else if (message.lang === 'ru') {
            return {
                subject: 'Ваши данные для доступа к сервису doma.ai.',
                text: `
                    Номер телефона: ${userPhone}
                    Пароль: ${userPassword}
                    
                    Ссылка для авторизации: ${serverUrl}/auth/signin 
                `,
            }
        }
    }

    throw new Error('unknown template or lang')
}

module.exports = {
    renderTemplate,
}
