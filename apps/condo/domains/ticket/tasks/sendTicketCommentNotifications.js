const { get } = require('lodash')
const compact = require('lodash/compact')
const uniq = require('lodash/uniq')

const conf = require('@open-condo/config')
const { getByCondition, getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { TICKET_COMMENT_ADDED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')
const { RESIDENT_COMMENT_TYPE } = require('@condo/domains/ticket/constants')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')

const CREATE_RESIDENT_VISIBLE_COMMENT_BY_STAFF_TYPE = 'CREATE_RESIDENT_VISIBLE_COMMENT_BY_STAFF'
const CREATE_RESIDENT_COMMENT_BY_RESIDENT_TYPE = 'CREATE_RESIDENT_COMMENT_BY_RESIDENT'

const detectTicketCommentEventTypes = async ({ operation, updatedItem, ticket }) => {
    const isCreateOperation = operation === 'create'
    const createdById = get(updatedItem, 'createdBy')
    const canReadByResident = get(ticket, 'canReadByResident')
    const commentType = get(updatedItem, 'type')
    const isResidentComment = commentType === RESIDENT_COMMENT_TYPE
    const isCreateResidentCommentOperation = isCreateOperation && isResidentComment

    const createdByUser = await getById('User', createdById)
    const isCreatedByResident = createdByUser.type === RESIDENT
    const isCreatedByStaff = createdByUser.type === STAFF

    const result = {}

    result[CREATE_RESIDENT_VISIBLE_COMMENT_BY_STAFF_TYPE] = isCreateResidentCommentOperation && canReadByResident && isCreatedByStaff

    result[CREATE_RESIDENT_COMMENT_BY_RESIDENT_TYPE] = isCreateResidentCommentOperation && isCreatedByResident

    return result
}

/**
 * Sends notifications after ticket comment created
 */
const sendTicketCommentNotifications = async ({ operation, updatedItem }) => {
    const { keystone: context } = await getSchemaCtx('TicketComment')

    const ticket = await Ticket.getOne(context, { id: updatedItem.ticket })
    const eventTypes = await detectTicketCommentEventTypes({ operation, updatedItem, ticket })
    const clientId = get(ticket, 'client.id')
    const organizationId = get(ticket, 'organization.id')
    const propertyId = get(ticket, 'property.id')
    const unitName = get(ticket, 'unitName')
    const unitType = get(ticket, 'unitType')

    // no client in ticket means there is no resident connected to this ticket
    if (!clientId) return

    // TODO(DOMA-2822): get rid of this extra request by returning country within nested organization data
    const organization = await getByCondition('Organization', {
        id: organizationId,
        deletedAt: null,
    })
    const lang = get(COUNTRIES, [organization.country, 'locale'], conf.DEFAULT_LOCALE)

    const resident = await Resident.getOne(context, {
        user: { id: clientId },
        property: { id: propertyId },
        organization: { id: organizationId },
        unitName,
        unitType,
        deletedAt: null,
    })

    if (eventTypes[CREATE_RESIDENT_VISIBLE_COMMENT_BY_STAFF_TYPE] && clientId) {
        await sendMessage(context, {
            lang,
            to: { user: { id: clientId } },
            type: TICKET_COMMENT_ADDED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId: ticket.id,
                    ticketNumber: ticket.number,
                    userId: clientId,
                    commentId: updatedItem.id,
                    url: `${conf.SERVER_URL}/ticket/${ticket.id}`,
                    residentId: get(resident, 'id', null),
                },
            },
            sender: updatedItem.sender,
            organization: { id: organization.id },
        })
    }

    if (eventTypes[CREATE_RESIDENT_COMMENT_BY_RESIDENT_TYPE]) {
        const ticketExecutorUserId = get(ticket, 'executor.id')
        const ticketAssigneeUserId = get(ticket, 'assignee.id')
        const usersToSendMessage = uniq(compact([ticketExecutorUserId, ticketAssigneeUserId]))

        for (const userId of usersToSendMessage) {
            await sendMessage(context, {
                lang,
                to: { user: { id: userId } },
                type: TICKET_COMMENT_ADDED_TYPE,
                meta: {
                    dv: 1,
                    data: {
                        ticketId: ticket.id,
                        ticketNumber: ticket.number,
                        userId: userId,
                        commentId: updatedItem.id,
                        url: `${conf.SERVER_URL}/ticket/${ticket.id}`,
                        residentId: get(resident, 'id', null),
                    },
                },
                sender: updatedItem.sender,
                organization: { id: organization.id },
            })
        }
    }
}

module.exports = {
    sendTicketCommentNotifications: createTask('sendTicketCommentNotifications', sendTicketCommentNotifications),
}