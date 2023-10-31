const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getByCondition, getSchemaCtx, getById } = require('@open-condo/keystone/schema')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { TICKET_COMMENT_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { getUsersAvailableToReadTicketByPropertyScope } = require('@condo/domains/ticket/utils/serverSchema/propertyScope')


/**
 * Sends notifications after ticket comment created
 */
const sendTicketCommentCreatedNotifications = async (commentId, ticketId) => {
    const { keystone: context } = await getSchemaCtx('Ticket')
    const createdComment = await getById('TicketComment', commentId)
    const commentAuthor = await getById('User', createdComment.user)
    const commentAuthorName = commentAuthor.name
    const ticket = await getById('Ticket', ticketId)
    const ticketOrganizationId = get(ticket, 'organization')

    const organization = await getByCondition('Organization', {
        id: ticketOrganizationId,
        deletedAt: null,
    })
    const lang = get(COUNTRIES, [organization.country, 'locale'], conf.DEFAULT_LOCALE)

    const users = await getUsersAvailableToReadTicketByPropertyScope({
        ticketOrganizationId: ticket.organization,
        ticketPropertyId: ticket.property,
        ticketExecutorId: ticket.executor,
        ticketAssigneeId: ticket.executor,
        ticketCategoryClassifierId: ticket.categoryClassifier,
    })
    const usersWithoutSender = users.filter(userId => userId !== createdComment.user)

    for (const employeeUserId of usersWithoutSender) {
        await sendMessage(context, {
            lang,
            to: { user: { id: employeeUserId } },
            type: TICKET_COMMENT_CREATED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId,
                    ticketNumber: ticket.number,
                    userId: employeeUserId,
                    url: `${conf.SERVER_URL}/ticket/${ticketId}`,
                    organizationId: organization.id,
                    organizationName: organization.name,
                    commentId,
                    userName: commentAuthorName,
                    content: createdComment.content,
                    commentType: createdComment.type,
                },
            },
            sender: { dv: 1, fingerprint: 'send-notifications' },
            organization: { id: organization.id },
        })
    }
}

module.exports = {
    sendTicketCommentCreatedNotifications,
}