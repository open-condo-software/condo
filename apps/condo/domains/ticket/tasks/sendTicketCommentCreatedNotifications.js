const dayjs = require('dayjs')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getByCondition, getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { TICKET_COMMENT_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { getUsersAvailableToReadTicketByPropertyScope } = require('@condo/domains/ticket/utils/serverSchema/propertyScope')


const EMPTY_CONTENT = '—'

/**
 * Sends notifications after ticket comment created
 */
const sendTicketCommentCreatedNotifications = async (commentId, ticketId) => {
    const { keystone: context } = getSchemaCtx('Ticket')
    const createdComment = await getById('TicketComment', commentId)
    const commentAuthor = await getById('User', createdComment.user)
    const ticket = await getById('Ticket', ticketId)
    const ticketOrganizationId = get(ticket, 'organization')
    const ticketStatus = await getById('TicketStatus', ticket.status)
    const ticketUrl = `${conf.SERVER_URL}/ticket/${ticketId}`

    const organization = await getByCondition('Organization', {
        id: ticketOrganizationId,
        deletedAt: null,
    })
    const lang = get(COUNTRIES, [organization.country, 'locale'], conf.DEFAULT_LOCALE)

    const OpenTicketMessage = i18n(`notification.messages.${TICKET_COMMENT_CREATED_TYPE}.telegram.openTicket`, { locale: lang })
    const TicketStatusName = i18n(`ticket.status.${ticketStatus.type}.name`, { locale: lang })
    const TicketUnitType = i18n(`field.UnitType.prefix.${ticket.unitType}`, { locale: lang }).toLowerCase()

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
                    organizationId: organization.id,
                    organizationName: organization.name,
                    commentId,
                    commentContent: createdComment.content,
                    commentType: createdComment.type,
                    commentCreatedAt: dayjs(createdComment.createdAt).format('YYYY-MM-DD HH:mm'),
                    ticketId,
                    ticketNumber: ticket.number,
                    ticketStatus: TicketStatusName,
                    ticketAddress: ticket.propertyAddress,
                    ticketUnit: ticket.unitName ? `${TicketUnitType} ${ticket.unitName}` : EMPTY_CONTENT,
                    userId: employeeUserId,
                    userName: commentAuthor.name,
                    url: ticketUrl,
                },
                telegramMeta: {
                    inlineKeyboard: [[{ text: OpenTicketMessage, url: ticketUrl }]],
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