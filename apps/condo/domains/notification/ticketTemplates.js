const get = require('lodash/get')

const conf = require('@core/config')

const { RU_LOCALE, EN_LOCALE } = require('@condo/domains/common/constants/locale')

const {
    EMAIL_TRANSPORT,
    SMS_TRANSPORT,
    PUSH_TRANSPORT,
} = require('./constants/constants')

const SERVER_URL = process.env.SERVER_URL || conf.SERVER_URL

const getTicketExecutorConnectedMessagePush = (message) => {
    const { id: notificationId } = message
    const { ticketId, ticketNumber, userId } = get(message, 'meta.data', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                notification: {
                    title: `You were assigned as executor of ticket #${ticketNumber}`,
                    body: 'Please read the details.',
                },
                data: { ticketId, notificationId, userId },
            }

        case RU_LOCALE:
            return {
                notification: {
                    title: `Вы назначены исполнителем(-ницей) по заявке №${ticketNumber}`,
                    body: 'Посмотрите детали заявки',
                },
                data: { ticketId, notificationId, userId },
            }
    }
}

const getTicketExecutorConnectedMessageSms = (message) => {
    const { ticketNumber } = get(message, 'meta.data', {})

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
    const { ticketId, ticketNumber } = get(message, 'meta.data', {})

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

module.exports = {
    getTicketExecutorConnectedMessage,
}
