const get = require('lodash/get')

const conf = require('@core/config')
const { getByCondition } = require('@core/keystone/schema')

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

const { Ticket } = require('./serverSchema')

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

const getResident = async (context, userId, propertyId, organizationId ) => {
    const where = {
        user: { id: userId },
        property: { id: propertyId },
        organization: { id: organizationId },
    }

    return await Resident.getOne(context, where)
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
    const lang = get(COUNTRIES, [organization.country, 'locale'], DEFAULT_LOCALE)

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
        })
    }

    if (eventTypes[STATUS_CHANGED_EVENT_TYPE]) {
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
            const { property: propertyId, organization: organizationId, unitName } = updatedItem
            const where = {
                user: { id: clientId },
                property: { id: propertyId },
                organization: { id: organizationId },
                unitName,
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
            })
        }
    }
}

const sendTicketCommentNotifications = async (requestData) => {
    const { updatedItem, context } = requestData
    const createdBy = get(updatedItem, 'createdBy')

    const ticket = await Ticket.getOne(context, { id: updatedItem.ticket })
    const clientId = get(ticket, 'client.id')
    const organizationId = get(ticket, 'organization.id')
    const propertyId = get(ticket, 'property.id')
    const unitName = get(ticket, 'unitName')

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

    if (clientId && createdBy !== clientId) {
        const where = {
            user: { id: clientId },
            property: { id: propertyId },
            organization: { id: organizationId },
            unitName,
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
                    url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                    residentId: get(resident, 'id', null),
                },
            },
            sender: updatedItem.sender,
        })
    }
}

module.exports = {
    sendTicketNotifications,
    sendTicketCommentNotifications,
    detectEventTypes,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
}
