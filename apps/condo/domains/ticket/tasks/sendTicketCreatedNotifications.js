const conf = require('@open-condo/config')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')

const { TICKET_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { getUsersAvailableToReadTicketByPropertyScope } = require('@condo/domains/ticket/utils/serverSchema/propertyScope')


/**
 * Sends notifications after ticket created
 */
const sendTicketCreatedNotifications = async (ticketId, lang, organizationId, organizationName) => {
    const { keystone: context } = await getSchemaCtx('Ticket')
    const createdTicket = await getById('Ticket', ticketId)

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
                    ticketId,
                    ticketNumber: createdTicket.number,
                    userId: employeeUserId,
                    url: `${conf.SERVER_URL}/ticket/${ticketId}`,
                    organizationId: organizationId,
                    organizationName: organizationName,
                    details: createdTicket.details,
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