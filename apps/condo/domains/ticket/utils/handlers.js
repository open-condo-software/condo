const get = require('lodash/get')

const conf = require('@core/config')
const { getByCondition } = require('@core/keystone/schema')

const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')

const { TICKET_ASSIGNEE_CONNECTED_TYPE, TICKET_EXECUTOR_CONNECTED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

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
    // const prevAssigneeId = !isCreateOperation && get(existingItem, 'assignee')
    const prevExecutorId = !isCreateOperation && get(existingItem, 'executor')
    const prevStatusId = !isCreateOperation && get(existingItem, 'status')
    // const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const nextStatusId = get(updatedItem, 'status')
    const result = {}

    /**
     * assignee connected within create ticket operation or
     * assignee connected/changed within update ticket operation
     */
    /**
     * After product case on push notifications with Alla Gubina and Mikhail Rumanovsky on 2022-04-05
     * we decided to temporarily disable sending notifications on assignee connection to ticket
     * This could change in nearest future, so I've commented code instead of deletion
     */
    // result[ASSIGNEE_CONNECTED_EVENT_TYPE] = isCreateOperation && !!nextAssigneeId || isUpdateOperation && !!nextAssigneeId && nextAssigneeId !== prevAssigneeId

    /**
     * executor connected within create ticket operation or
     * executor connected/changed within update ticket operation
     */
    result[EXECUTOR_CONNECTED_EVENT_TYPE] = isCreateOperation && !!nextExecutorId || isUpdateOperation && nextExecutorId && nextExecutorId !== prevExecutorId

    /**
     * ticket status changed
     */
    result[STATUS_CHANGED_EVENT_TYPE] = isCreateOperation && !!nextStatusId || isUpdateOperation && nextStatusId && nextStatusId !== prevStatusId

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
const handleTicketEvents = async (requestData) => {
    const eventTypes = detectEventTypes(requestData)
    const { operation, existingItem, updatedItem, context } = requestData
    const isCreateOperation =  operation === 'create'
    const prevAssigneeId = !isCreateOperation && get(existingItem, 'assignee')
    const prevExecutorId = !isCreateOperation && get(existingItem, 'executor')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')

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
        await sendMessage(context, {
            lang,
            to: { user: { id: nextAssigneeId || prevAssigneeId } },
            type: TICKET_ASSIGNEE_CONNECTED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId: nextAssigneeId || prevAssigneeId,
                    url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                    domain: 'ticket',
                },
            },
            sender: updatedItem.sender,
        })
    }

    if (eventTypes[EXECUTOR_CONNECTED_EVENT_TYPE]) {
        await sendMessage(context, {
            lang,
            to: { user: { id: nextExecutorId || prevExecutorId } },
            type: TICKET_EXECUTOR_CONNECTED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId: nextExecutorId || prevExecutorId,
                    url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                    domain: 'ticket',
                },
            },
            sender: updatedItem.sender,
        })
    }

    if (eventTypes[STATUS_CHANGED_EVENT_TYPE]) {
        // TODO(DOMA-2434): Add logic for sending notifications to resident on ticket status change
    }
}

module.exports = {
    handleTicketEvents,
    detectEventTypes,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
}