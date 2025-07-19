const get = require('lodash/get')

const TICKET_CREATED = 'TICKET_CREATED'
const ASSIGNEE_CONNECTED_EVENT_TYPE = 'ASSIGNEE_CONNECTED'
const EXECUTOR_CONNECTED_EVENT_TYPE = 'EXECUTOR_CONNECTED'
const STATUS_CHANGED_EVENT_TYPE = 'STATUS_CHANGED'
const TICKET_WITHOUT_RESIDENT_CREATED_EVENT_TYPE = 'TICKET_WITHOUT_RESIDENT_CREATED'

/**
 * Detects possible events within Ticket schema request
 * @param operation
 * @param existingItem
 * @param updatedItem
 * @returns {{}}
 */
const detectTicketEventTypes = ({ operation, existingItem, updatedItem }) => {
    const isCreateOperation = operation === 'create'
    const isUpdateOperation = operation === 'update'
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
    const isResidentTicket = get(updatedItem, 'isResidentTicket')
    const canReadByResident = get(updatedItem, 'canReadByResident')
    const result = {}

    /**
     * ticket created
     */
    result[TICKET_CREATED] = isCreateOperation

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

    /**
     * ticket created and the resident does not have a mobile app or
     * does not have an address as in ticket
     */
    result[TICKET_WITHOUT_RESIDENT_CREATED_EVENT_TYPE] = isCreateOperation && isResidentTicket && !client && canReadByResident

    return result
}

module.exports = {
    TICKET_CREATED,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
    TICKET_WITHOUT_RESIDENT_CREATED_EVENT_TYPE,
    detectTicketEventTypes,
}