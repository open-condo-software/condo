const get = require('lodash/get')

const { find } = require('@open-condo/keystone/schema')

const { RESIDENT_COMMENT_TYPE, ORGANIZATION_COMMENT_TYPE } = require('@condo/domains/ticket/constants')
const { sendTicketCommentCreatedNotifications } = require('@condo/domains/ticket/tasks')
const {
    sendTicketCommentNotifications: sendTicketCommentNotificationsTask,
} = require('@condo/domains/ticket/tasks/sendTicketCommentNotifications')
const { UserTicketCommentReadTime } = require('@condo/domains/ticket/utils/serverSchema')
const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')

const { detectTicketEventTypes, ASSIGNEE_CONNECTED_EVENT_TYPE, EXECUTOR_CONNECTED_EVENT_TYPE, STATUS_CHANGED_EVENT_TYPE } = require('./detectTicketEventTypes')
const { Ticket } = require('./serverSchema')


const sendTicketCommentNotifications = async (requestData) => {
    const { operation, updatedItem } = requestData

    if (operation === 'create') {
        const ticketId = get(updatedItem, 'ticket')
        await sendTicketCommentCreatedNotifications.delay(updatedItem.id, ticketId)
    }

    await sendTicketCommentNotificationsTask.delay({
        operation,
        ticketId: get(updatedItem, 'ticket'),
        createdById: get(updatedItem, 'createdBy'),
        commentId: updatedItem.id,
        commentType: get(updatedItem, 'type'),
        sender: updatedItem.sender,
    })
}

const updateTicketReadCommentTime = async (context, updatedItem) => {
    const ticketId = get(updatedItem, 'ticket')
    const dv = get(updatedItem, 'dv')
    const sender = get(updatedItem, 'sender')
    const now = new Date().toISOString()

    const userTicketCommentReadTimeObjects = await find('UserTicketCommentReadTime', {
        ticket: { id: ticketId },
        user: { type: STAFF },
    })

    for (const { id } of userTicketCommentReadTimeObjects) {
        await UserTicketCommentReadTime.update(context, id, {
            dv,
            sender,
            readResidentCommentAt: now,
        })
    }
}

const updateTicketLastCommentTime = async (context, updatedItem, userType, commentCreatedAt) => {
    const ticketId = get(updatedItem, 'ticket')
    const dv = get(updatedItem, 'dv')
    const sender = get(updatedItem, 'sender')
    const commentType = get(updatedItem, 'type')

    const lastResidentCommentAt = userType === RESIDENT ? commentCreatedAt : undefined
    const lastCommentWithResidentTypeAt = commentType === RESIDENT_COMMENT_TYPE ? commentCreatedAt : undefined
    const lastCommentWithOrganizationTypeAt = commentType === ORGANIZATION_COMMENT_TYPE ? commentCreatedAt : undefined
    
    await Ticket.update(context, ticketId, {
        dv,
        sender,
        lastCommentAt: commentCreatedAt,
        lastResidentCommentAt,
        lastCommentWithResidentTypeAt,
        lastCommentWithOrganizationTypeAt,
        lastCommentWithResidentTypeCreatedByUserType: commentType === RESIDENT_COMMENT_TYPE ? userType : undefined,
    })
}

module.exports = {
    sendTicketCommentNotifications,
    detectTicketEventTypes,
    updateTicketReadCommentTime,
    updateTicketLastCommentTime,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
}
