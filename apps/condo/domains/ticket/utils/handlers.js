const get = require('lodash/get')

const conf = require('@core/config')
const { getByCondition, find, getById } = require('@core/keystone/schema')

const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

const {
    TICKET_ASSIGNEE_CONNECTED_TYPE,
    TICKET_EXECUTOR_CONNECTED_TYPE,
    TICKET_STATUS_OPENED_TYPE,
    TICKET_STATUS_IN_PROGRESS_TYPE,
    TICKET_STATUS_COMPLETED_TYPE,
    TICKET_STATUS_RETURNED_TYPE,
    TICKET_STATUS_DECLINED_TYPE,
    TICKET_COMMENT_ADDED_TYPE,
} = require('@condo/domains/notification/constants/constants')

const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

const { Ticket, TicketCommentsTime } = require('./serverSchema')
const { PUSH_TRANSPORT } = require('@condo/domains/notification/constants/constants')
const { RESIDENT_COMMENT_TYPE } = require('@condo/domains/ticket/constants')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { UserTicketCommentReadTime } = require('@condo/domains/ticket/utils/serverSchema')

const ASSIGNEE_CONNECTED_EVENT_TYPE = 'ASSIGNEE_CONNECTED'
const EXECUTOR_CONNECTED_EVENT_TYPE = 'EXECUTOR_CONNECTED'
const STATUS_CHANGED_EVENT_TYPE = 'STATUS_CHANGED'

/**
 * Detects possible events within Ticket schema request
 * @param operation
 * @param existingItem
 * @param updatedItem
 * @returns {{}}
 */
const detectEventTypes = ({ operation, existingItem, updatedItem }) => {
    const isCreateOperation =  operation === 'create'
    const isUpdateOperation =  operation === 'update'
    const prevAssigneeId = !isCreateOperation && get(existingItem, 'assignee')
    const prevExecutorId = !isCreateOperation && get(existingItem, 'executor')
    const prevStatusId = !isCreateOperation && get(existingItem, 'status')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const isAssigneeAdded = isCreateOperation && !!nextAssigneeId
    const isAssigneeUpdated = isUpdateOperation && !!nextAssigneeId && nextAssigneeId !== prevAssigneeId
    const isExecutorAdded = isCreateOperation && !!nextExecutorId
    const isExecutorUpdated = isUpdateOperation && nextExecutorId && nextExecutorId !== prevExecutorId
    const nextStatusId = get(updatedItem, 'status')
    const isStatusAdded = isCreateOperation && !!nextStatusId
    const isStatusUpdated = isUpdateOperation && nextStatusId && nextStatusId !== prevStatusId
    const client = get(updatedItem, 'client')
    const result = {}

    /**
     * assignee connected within create ticket operation or
     * assignee connected/changed within update ticket operation
     * and executor is not the same person with assignee
     */
    /**
     * After product case on push notifications with Alla Gubina and Mikhail Rumanovsky on 2022-04-05
     * we decided to temporarily disable sending notifications on assignee connection to ticket
     * This could change in nearest future, so I've commented code instead of deletion
     */
    result[ASSIGNEE_CONNECTED_EVENT_TYPE] = isAssigneeAdded || isAssigneeUpdated

    /**
     * executor connected within create ticket operation or
     * executor connected/changed within update ticket operation
     */
    result[EXECUTOR_CONNECTED_EVENT_TYPE] = isExecutorAdded || isExecutorUpdated

    /**
     * ticket status gets the status open within create ticket operation or
     * ticket status changed within update ticket operation
     */
    result[STATUS_CHANGED_EVENT_TYPE] = client && (isStatusAdded || isStatusUpdated)

    return result
}

/**
 * Basically sends different kinds of notifications when assignee/executable added to Ticket, status changed, etc.
 * @param operation
 * @param existingItem
 * @param updatedItem
 * @param context
 * @returns {Promise<void>}
 */
const sendTicketNotifications = async (requestData) => {
    const eventTypes = detectEventTypes(requestData)
    const { operation, existingItem, updatedItem, context } = requestData
    const isCreateOperation =  operation === 'create'
    const prevAssigneeId = !isCreateOperation && get(existingItem, 'assignee')
    const prevExecutorId = !isCreateOperation && get(existingItem, 'executor')
    const prevStatusId = get(existingItem, 'status')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const nextStatusId = get(updatedItem, 'status')
    const clientId = get(updatedItem, 'client')
    const statusReopenedCounter = get(updatedItem, 'statusReopenedCounter')
    const createdBy = get(updatedItem, 'createdBy')
    const updatedBy = get(updatedItem, 'updatedBy')
    const canReadByResident = get(updatedItem, 'canReadByResident') || get(existingItem, 'canReadByResident')

    // TODO(DOMA-2822): get rid of this extra request by returning country within nested organization data
    const organization = await getByCondition('Organization', {
        id: updatedItem.organization,
        deletedAt: null,
    })

    /**
     * Detect message language
     * Use DEFAULT_LOCALE if organization.country is unknown
     * (not defined within @condo/domains/common/constants/countries)
     */
    const organizationCountry = get(organization, 'country')
    const lang = get(COUNTRIES, [organizationCountry, 'locale'], DEFAULT_LOCALE)

    if (eventTypes[ASSIGNEE_CONNECTED_EVENT_TYPE]) {
        const userId = nextAssigneeId || prevAssigneeId

        await sendMessage(context, {
            lang,
            to: { user: { id: userId } },
            type: TICKET_ASSIGNEE_CONNECTED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId,
                    url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                },
            },
            sender: updatedItem.sender,
            organization: { connect: { id: organization.id } },
        })
    }

    if (eventTypes[EXECUTOR_CONNECTED_EVENT_TYPE]) {
        const userId = nextExecutorId || prevExecutorId

        await sendMessage(context, {
            lang,
            to: { user: { id: userId } },
            type: TICKET_EXECUTOR_CONNECTED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId,
                    url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                },
            },
            sender: updatedItem.sender,
            organization: { connect: { id: organization.id } },
        })
    }

    if (eventTypes[STATUS_CHANGED_EVENT_TYPE] && canReadByResident) {
        let ticketStatusType

        switch (nextStatusId) {
            case STATUS_IDS.OPEN:
                if (prevStatusId !== STATUS_IDS.COMPLETED && !isCreateOperation)
                    break

                if (statusReopenedCounter > 0)
                    ticketStatusType = updatedBy !== clientId && TICKET_STATUS_RETURNED_TYPE
                else
                    ticketStatusType = createdBy !== clientId && TICKET_STATUS_OPENED_TYPE
                break

            case STATUS_IDS.IN_PROGRESS:
                ticketStatusType = TICKET_STATUS_IN_PROGRESS_TYPE
                break

            case STATUS_IDS.COMPLETED:
                ticketStatusType = TICKET_STATUS_COMPLETED_TYPE
                break

            case STATUS_IDS.DECLINED:
                ticketStatusType = TICKET_STATUS_DECLINED_TYPE
                break
        }

        if (ticketStatusType) {
            const { property: propertyId, organization: organizationId, unitName, unitType } = updatedItem
            const where = {
                user: { id: clientId },
                property: { id: propertyId },
                organization: { id: organizationId },
                unitName,
                unitType,
            }
            const resident = await Resident.getOne(context, where)

            await sendMessage(context, {
                lang,
                to: { user: { id: clientId } },
                type: ticketStatusType,
                meta: {
                    dv: 1,
                    data: {
                        ticketId: updatedItem.id,
                        ticketNumber: updatedItem.number,
                        userId: clientId,
                        url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                        residentId: get(resident, 'id', null),
                    },
                },
                sender: updatedItem.sender,
                organization: { connect: { id: organization.id } },
            })
        }
    }
}

const sendTicketCommentNotifications = async (requestData) => {
    const { updatedItem, context, operation } = requestData
    const createdBy = get(updatedItem, 'createdBy')
    const isCreateOperation =  operation === 'create'

    const ticket = await Ticket.getOne(context, { id: updatedItem.ticket })
    const clientId = get(ticket, 'client.id')
    const commentType = get(updatedItem, 'type')
    const client = get(ticket, 'client.id')
    const organizationId = get(ticket, 'organization.id')
    const propertyId = get(ticket, 'property.id')
    const unitName = get(ticket, 'unitName')
    const unitType = get(ticket, 'unitType')
    const canReadByResident = get(ticket, 'canReadByResident')

    // Don't send notifications on tickets with canReadByResident === FALSE
    if (!canReadByResident) return

    if (client && isCreateOperation && createdBy !== client && commentType === RESIDENT_COMMENT_TYPE) {
        // TODO(DOMA-2822): get rid of this extra request by returning country within nested organization data
        const organization = await getByCondition('Organization', {
            id: organizationId,
            deletedAt: null,
        })

        /**
         * Detect message language
         * Use DEFAULT_LOCALE if organization.country is unknown
         * (not defined within @condo/domains/common/constants/countries)
         */
        const lang = get(COUNTRIES, [organization.country, 'locale'], DEFAULT_LOCALE)

        const where = {
            user: { id: clientId },
            property: { id: propertyId },
            organization: { id: organizationId },
            unitName,
            unitType,
        }
        const resident = await Resident.getOne(context, where)

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
            organization: { connect: { id: organization.id } },
        })
    }
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

const updateTicketLastCommentTime = async (context, updatedItem) => {
    const ticketId = get(updatedItem, 'ticket')
    const dv = get(updatedItem, 'dv')
    const sender = get(updatedItem, 'sender')
    const lastCommentAt = get(updatedItem, 'createdAt', new Date()).toISOString()

    await Ticket.update(context, ticketId, {
        dv, sender, lastCommentAt,
    })
}

module.exports = {
    sendTicketNotifications,
    sendTicketCommentNotifications,
    detectEventTypes,
    createOrUpdateTicketCommentsTime,
    updateTicketLastCommentTime,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
}
