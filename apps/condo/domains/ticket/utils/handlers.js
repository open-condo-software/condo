const get = require('lodash/get')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getByCondition, find, getById } = require('@open-condo/keystone/schema')

const { SEND_TELEGRAM_NOTIFICATIONS } = require('@condo/domains/common/constants/featureflags')
const { sendTicketCommentCreatedNotifications } = require('@condo/domains/ticket/tasks')
const {
    sendTicketCommentNotifications: sendTicketCommentNotificationsTask,
} = require('@condo/domains/ticket/tasks/sendTicketCommentNotifications')
const { UserTicketCommentReadTime } = require('@condo/domains/ticket/utils/serverSchema')
const { RESIDENT } = require('@condo/domains/user/constants/common')

const { detectTicketEventTypes, ASSIGNEE_CONNECTED_EVENT_TYPE, EXECUTOR_CONNECTED_EVENT_TYPE, STATUS_CHANGED_EVENT_TYPE } = require('./detectTicketEventTypes')
const { Ticket, TicketCommentsTime } = require('./serverSchema')


const sendTicketCommentNotifications = async (requestData) => {
    const { operation, updatedItem } = requestData

    if (operation === 'create') {
        const ticketId = get(updatedItem, 'ticket')
        const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(
            get(requestData, 'context'),
            SEND_TELEGRAM_NOTIFICATIONS,
        )

        if (isFeatureEnabled) {
            await sendTicketCommentCreatedNotifications.delay(updatedItem.id, ticketId)
        }
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

const createOrUpdateTicketCommentsTime = async (context, updatedItem, userType) => {
    const ticketId = get(updatedItem, 'ticket')
    const dv = get(updatedItem, 'dv')
    const sender = get(updatedItem, 'sender')
    const now = new Date().toISOString()

    const ticketCommentsTime = await getByCondition('TicketCommentsTime', {
        ticket: { id: ticketId },
    })

    if (userType === RESIDENT) {
        if (!ticketCommentsTime) {
            const ticket = await getById('Ticket', ticketId)
            if (!ticket) return false

            await TicketCommentsTime.create(context, {
                dv,
                sender,
                ticket: { connect: { id: ticketId } },
                lastCommentAt: now,
                lastResidentCommentAt: now,
            })
        } else {
            await TicketCommentsTime.update(context, ticketCommentsTime.id, {
                dv,
                sender,
                lastCommentAt: now,
                lastResidentCommentAt: now,
            })
        }
    } else {
        if (!ticketCommentsTime) {
            const ticket = await getById('Ticket', ticketId)
            if (!ticket) return false

            await TicketCommentsTime.create(context, {
                dv,
                sender,
                ticket: { connect: { id: ticketId } },
                lastCommentAt: now,
            })
        } else {
            await TicketCommentsTime.update(context, ticketCommentsTime.id, {
                dv,
                sender,
                lastCommentAt: now,
            })
        }

        const userTicketCommentReadTimeObjects = await find('UserTicketCommentReadTime', {
            ticket: { id: ticketId },
        })

        for (const { id } of userTicketCommentReadTimeObjects) {
            await UserTicketCommentReadTime.update(context, id, {
                dv: 1,
                sender,
                readResidentCommentAt: now,
            })
        }
    }
}

const updateTicketLastCommentTime = async (context, updatedItem, userType) => {
    const ticketId = get(updatedItem, 'ticket')
    const dv = get(updatedItem, 'dv')
    const sender = get(updatedItem, 'sender')
    const lastCommentAt = get(updatedItem, 'createdAt', new Date()).toISOString()
    const lastResidentCommentAt = userType === RESIDENT ? lastCommentAt : undefined

    await Ticket.update(context, ticketId, {
        dv,
        sender,
        lastCommentAt,
        lastResidentCommentAt,
    })
}

module.exports = {
    sendTicketCommentNotifications,
    detectTicketEventTypes,
    createOrUpdateTicketCommentsTime,
    updateTicketLastCommentTime,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
}
