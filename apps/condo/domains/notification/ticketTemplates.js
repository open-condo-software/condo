const get = require('lodash/get')

const conf = require('@core/config')

const { RU_LOCALE, EN_LOCALE } = require('@condo/domains/common/constants/locale')

const {
    EMAIL_TRANSPORT,
    SMS_TRANSPORT,
    PUSH_TRANSPORT,
} = require('./constants/constants')

const SERVER_URL = process.env.SERVER_URL || conf.SERVER_URL

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

module.exports = {
    getTicketAssigneeConnectedMessage,
    getTicketExecutorConnectedMessage,
}