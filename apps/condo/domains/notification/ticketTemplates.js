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
    const { ticketId, ticketNumber, userId } = get(message, 'meta.data', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                notification: {
                    title: `You were assigned as responsible of ticket #${ticketNumber}`,
                    body: 'Please read the details.',
                },
                data: { ticketId, notificationId, userId },
            }

        case RU_LOCALE:
            return {
                notification: {
                    title: `Вы назначены ответственным(-ой) по заявке №${ticketNumber}`,
                    body: 'Посмотрите детали заявки',
                },
                data: { ticketId, notificationId, userId },
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


const getTicketStatusInWorkMessagePush = (message) => {
    const { id: notificationId } = message
    const { ticketId, ticketNumber, userId } = get(message, 'meta.data', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                notification: {
                    title: `Ticket status changed #${ticketNumber}`,
                    body: '👉🏻 «In work»',
                },
                data: { ticketId, notificationId, userId },
            }

        case RU_LOCALE:
            return {
                notification: {
                    title: `Изменился статус заявки №${ticketNumber}`,
                    body: '👉🏻 «В работе»',
                },
                data: { ticketId, notificationId, userId },
            }
    }
}

const getTicketStatusInWorkMessageSms = (message) => {
    const { ticketNumber } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                text: `Ticket status changed #${ticketNumber}`,
            }

        case RU_LOCALE:
            return {
                text: `Изменился статус заявки №${ticketNumber}`,
            }
    }
}

const getTicketStatusInWorkMessageEmail = (message) => {
    const { ticketId, ticketNumber } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                subject: `Ticket status changed #${ticketNumber}`,
                text: `Please follow the link to view the ticket: ${SERVER_URL}/ticket/${ticketId}`,
            }

        case RU_LOCALE:
            return {
                subject: `Изменился статус заявки №${ticketNumber}`,
                text: `Ознакомиться с заявкой можнжо по ссылке: ${SERVER_URL}/ticket/${ticketId}`,
            }
    }
}

const getTicketStatusInWorkMessage = (message, transport) => {
    switch (transport) {
        case PUSH_TRANSPORT: return getTicketStatusInWorkMessagePush(message)
        case EMAIL_TRANSPORT: return getTicketStatusInWorkMessageEmail(message)
        case SMS_TRANSPORT: return getTicketStatusInWorkMessageSms(message)
    }
}


const getTicketStatusCompletedMessagePush = (message) => {
    const { id: notificationId } = message
    const { ticketId, userId } = get(message, 'meta.data', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                notification: {
                    title: 'Your ticket has been completed',
                    body: 'Evaluate the work on the ticket',
                },
                data: { ticketId, notificationId, userId },
            }

        case RU_LOCALE:
            return {
                notification: {
                    title: 'Ваша заявка выполнена',
                    body: 'Оцените работу по заявке',
                },
                data: { ticketId, notificationId, userId },
            }
    }
}

const getTicketStatusCompletedMessageSms = (message) => {
    switch (message.lang) {
        case EN_LOCALE:
            return {
                text: 'Your ticket has been completed',
            }

        case RU_LOCALE:
            return {
                text: 'Ваша заявка выполнена',
            }
    }
}

const getTicketStatusCompletedMessageEmail = (message) => {
    const { ticketId } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                subject: 'Your ticket has been completed',
                text: `Please follow the link to view the ticket: ${SERVER_URL}/ticket/${ticketId}`,
            }

        case RU_LOCALE:
            return {
                subject: 'Ваша заявка выполнена',
                text: `Ознакомиться с заявкой можнжо по ссылке: ${SERVER_URL}/ticket/${ticketId}`,
            }
    }
}

const getTicketStatusCompletedMessage = (message, transport) => {
    switch (transport) {
        case PUSH_TRANSPORT: return getTicketStatusCompletedMessagePush(message)
        case EMAIL_TRANSPORT: return getTicketStatusCompletedMessageEmail(message)
        case SMS_TRANSPORT: return getTicketStatusCompletedMessageSms(message)
    }
}


const getTicketStatusReturnedMessagePush = (message) => {
    const { id: notificationId } = message
    const { ticketId, ticketNumber, userId } = get(message, 'meta.data', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                notification: {
                    title: `Returned the ticket #${ticketNumber} in work`,
                    body: 'We deal with the problem',
                },
                data: { ticketId, notificationId, userId },
            }

        case RU_LOCALE:
            return {
                notification: {
                    title: `Вернули заявку №${ticketNumber} в работу`,
                    body: 'Уже разбираемся с проблемой',
                },
                data: { ticketId, notificationId, userId },
            }
    }
}

const getTicketStatusReturnedMessageSms = (message) => {
    const { ticketNumber } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                text: `Returned the ticket #${ticketNumber} in work`,
            }

        case RU_LOCALE:
            return {
                text: `Вернули заявку №${ticketNumber} в работу`,
            }
    }
}

const getTicketStatusReturnedMessageEmail = (message) => {
    const { ticketId, ticketNumber } = get(message, 'meta', {})

    switch (message.lang) {
        case EN_LOCALE:
            return {
                subject: `Returned the ticket #${ticketNumber} in work`,
                text: `Please follow the link to view the ticket: ${SERVER_URL}/ticket/${ticketId}`,
            }

        case RU_LOCALE:
            return {
                subject: `Вернули заявку №${ticketNumber} в работу`,
                text: `Ознакомиться с заявкой можнжо по ссылке: ${SERVER_URL}/ticket/${ticketId}`,
            }
    }
}

const getTicketStatusReturnedMessage = (message, transport) => {
    switch (transport) {
        case PUSH_TRANSPORT: return getTicketStatusReturnedMessagePush(message)
        case EMAIL_TRANSPORT: return getTicketStatusReturnedMessageEmail(message)
        case SMS_TRANSPORT: return getTicketStatusReturnedMessageSms(message)
    }
}

module.exports = {
    getTicketAssigneeConnectedMessage,
    getTicketExecutorConnectedMessage,
    getTicketStatusInWorkMessage,
    getTicketStatusCompletedMessage,
    getTicketStatusReturnedMessage,
}