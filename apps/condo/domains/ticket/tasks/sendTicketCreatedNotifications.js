const dayjs = require('dayjs')
const { v4: uuid } = require('uuid')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { i18n } = require('@open-condo/locales/loader')

const { setLocaleForKeystoneContext } = require('@condo/domains/common/utils/serverSchema/setLocaleForKeystoneContext')
const { TICKET_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { buildFullClassifierName } = require('@condo/domains/ticket/utils')
const { TicketClassifier } = require('@condo/domains/ticket/utils/serverSchema')
const { getUsersAvailableToReadTicketByPropertyScope } = require('@condo/domains/ticket/utils/serverSchema/propertyScope')


const appLogger = getLogger('condo')
const taskLogger = appLogger.child({ module: 'tasks/sendTicketCreatedNotifications' })

const EMPTY_CONTENT = '—'

/**
 * Sends notifications after ticket created
 */
const sendTicketCreatedNotifications = async (ticketId, lang, organizationId, organizationName) => {
    const taskId = uuid()
    try {
        const { keystone: context } = getSchemaCtx('Ticket')
        setLocaleForKeystoneContext(context, lang)

        const createdTicket = await getById('Ticket', ticketId)
        const ticketStatus = await getById('TicketStatus', createdTicket.status)
        const ticketUrl = `${conf.SERVER_URL}/ticket/${ticketId}`
        const classifier = await TicketClassifier.getOne(context, { id: createdTicket.classifier })

        const ticketStatusName = i18n(`ticket.status.${ticketStatus.type}.name`, { locale: lang })
        const ticketUnitType = i18n(`field.UnitType.prefix.${createdTicket.unitType}`, { locale: lang }).toLowerCase()
        const OpenTicketMessage = i18n(`notification.messages.${TICKET_CREATED_TYPE}.telegram.openTicket`, { locale: lang })

        const ticketClassifier = buildFullClassifierName(classifier)

        const users = await getUsersAvailableToReadTicketByPropertyScope({
            ticketOrganizationId: createdTicket.organization,
            ticketPropertyId: createdTicket.property,
            ticketExecutorId: createdTicket.executor,
            ticketAssigneeId: createdTicket.executor,
            ticketCategoryClassifierId: createdTicket.categoryClassifier,
        })
        const usersWithoutAuthor = users.filter(userId => createdTicket.createdBy !== userId)

        for (const employeeUserId of usersWithoutAuthor) {
            await sendMessage(context, {
                lang,
                to: { user: { id: employeeUserId } },
                type: TICKET_CREATED_TYPE,
                meta: {
                    dv: 1,
                    data: {
                        organizationId: organizationId,
                        organizationName: organizationName,
                        ticketId,
                        ticketClassifier,
                        ticketNumber: createdTicket.number,
                        ticketStatus: ticketStatusName,
                        ticketAddress: createdTicket.propertyAddress,
                        ticketUnit: createdTicket.unitName ? `${ticketUnitType} ${createdTicket.unitName}` : EMPTY_CONTENT,
                        ticketCreatedAt: dayjs(createdTicket.createdAt).format('YYYY-MM-DD HH:mm'),
                        ticketDetails: createdTicket.details,
                        userId: employeeUserId,
                        url: ticketUrl,
                    },
                    telegramMeta: {
                        inlineKeyboard: [[{ text: OpenTicketMessage, url: ticketUrl }]],
                    },
                },
                sender: { dv: 1, fingerprint: 'send-notifications' },
                organization: { id: organizationId },
            })
        }
    } catch (error) {
        taskLogger.error({
            msg: 'Failed to send notifications about created ticket',
            data: { taskId, ticketId },
            error,
        })
    }
}

// TODO(DOMA-8677): think about tasks export
module.exports = {
    sendTicketCreatedNotificationsFn: sendTicketCreatedNotifications,
    sendTicketCreatedNotifications: createTask('sendTicketCreatedNotifications', sendTicketCreatedNotifications),
}
