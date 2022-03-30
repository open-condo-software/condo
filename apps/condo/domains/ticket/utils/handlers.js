const get = require('lodash/get')

const { getByCondition } = require('@core/keystone/schema')

const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

const {
    TICKET_ASSIGNEE_CONNECTED_TYPE,
    TICKET_EXECUTOR_CONNECTED_TYPE,
    TICKET_STATUS_IN_PROGRESS,
    TICKET_STATUS_COMPLETED,
    TICKET_STATUS_RETURNED,
    TICKET_ADD_INDICATE,
    TICKET_DELETE_INDICATE,
} = require('@condo/domains/notification/constants/constants')

const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const ASSIGNEE_CONNECTED_EVENT_TYPE = 'ASSIGNEE_CONNECTED'
const EXECUTOR_CONNECTED_EVENT_TYPE = 'EXECUTOR_CONNECTED'
const STATUS_CHANGED_EVENT_TYPE = 'STATUS_CHANGED'
const WARRANTY_CHANGED_EVENT_TYPE = 'WARRANTY_CHANGED'

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
    const prevWarranty = !isCreateOperation && get(existingItem, 'isWarranty')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const nextStatusId = get(updatedItem, 'status')
    const nextWarranty = get(updatedItem, 'isWarranty')
    const result = {}

    /**
     * assignee connected within create ticket operation or
     * assignee connected/changed within update ticket operation
     */
    result[ASSIGNEE_CONNECTED_EVENT_TYPE] = isCreateOperation && !!nextAssigneeId || isUpdateOperation && !!nextAssigneeId && nextAssigneeId !== prevAssigneeId

    /**
     * executor connected within create ticket operation or
     * executor connected/changed within update ticket operation
     */
    result[EXECUTOR_CONNECTED_EVENT_TYPE] = isCreateOperation && !!nextExecutorId || isUpdateOperation && nextExecutorId && nextExecutorId !== prevExecutorId

    /**
     * ticket status changed
     */
    result[STATUS_CHANGED_EVENT_TYPE] = isCreateOperation && !!nextStatusId || isUpdateOperation && nextStatusId && nextStatusId !== prevStatusId


    /**
     * ticket change warranty indicate
     */
    result[WARRANTY_CHANGED_EVENT_TYPE] = isCreateOperation && !!nextWarranty || isUpdateOperation && nextWarranty && nextWarranty !== prevWarranty

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
    const prevWarranty = !isCreateOperation && get(existingItem, 'isWarranty')
    const prevStatusId = !isCreateOperation && get(existingItem, 'status')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const nextWarranty = get(updatedItem, 'isWarranty')
    const nextStatusId = get(updatedItem, 'status')

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
                },
            },
            sender: updatedItem.sender,
        })
    }

    if (eventTypes[STATUS_CHANGED_EVENT_TYPE]) {
        let type
        switch (nextStatusId) {
            case STATUS_IDS.IN_PROGRESS:
                type = prevStatusId !== STATUS_IDS.COMPLETED ? TICKET_STATUS_IN_PROGRESS : TICKET_STATUS_RETURNED
                break

            case STATUS_IDS.COMPLETED:
                type = TICKET_STATUS_COMPLETED
                break
        }

        if (type) {
            await sendMessage(context, {
                lang,
                to: { user: { id: nextAssigneeId || prevAssigneeId } },
                type,
                meta: {
                    dv: 1,
                    data: {
                        ticketId: updatedItem.id,
                        ticketNumber: updatedItem.number,
                        userId: nextAssigneeId || prevAssigneeId,
                    },
                },
                sender: updatedItem.sender,
            })
        }
    }

    if (eventTypes[WARRANTY_CHANGED_EVENT_TYPE]) {
        await sendMessage(context, {
            lang,
            to: { user: { id: nextAssigneeId || prevAssigneeId } },
            type: !nextWarranty ? TICKET_ADD_INDICATE : TICKET_DELETE_INDICATE,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId: nextAssigneeId || prevAssigneeId,
                    typeIndicate: 'гарантийной',
                },
            },
            sender: updatedItem.sender,
        })
    }
}

module.exports = {
    handleTicketEvents,
    detectEventTypes,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
}