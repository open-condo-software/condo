const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { TICKET_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { getUsersAvailableToReadTicketByPropertyScope } = require('@condo/domains/ticket/utils/serverSchema/propertyScope')


const EMPTY_CONTENT = '—'

/**
 * Sends notifications after ticket created
 */
const sendTicketCreatedNotifications = async (ticketId, lang, organizationId, organizationName) => {
    const { keystone: context } = getSchemaCtx('Ticket')
    const createdTicket = await getById('Ticket', ticketId)
    const ticketStatus = await getById('TicketStatus', createdTicket.status)
    const ticketStatusName = i18n(`ticket.status.${ticketStatus.type}.name`, { locale: lang })
    const ticketUnitType = i18n(`field.UnitType.prefix.${createdTicket.unitType}`, { locale: lang }).toLowerCase()

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
                    ticketNumber: createdTicket.number,
                    ticketStatus: ticketStatusName,
                    ticketAddress: createdTicket.propertyAddress,
                    ticketUnit: createdTicket.unitName ? `${ticketUnitType} ${createdTicket.unitName}` : EMPTY_CONTENT,
                    ticketCreatedAt: dayjs(createdTicket.createdAt).format('YYYY-MM-DD HH:mm'),
                    ticketDetails: createdTicket.details,
                    userId: employeeUserId,
                    url: `${conf.SERVER_URL}/ticket/${ticketId}`,
                },
            },
            sender: { dv: 1, fingerprint: 'send-notifications' },
            organization: { id: organizationId },
        })
    }
}

module.exports = {
    sendTicketCreatedNotifications,
}