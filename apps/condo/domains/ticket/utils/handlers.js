const get = require('lodash/get')
import { useIntl } from '@core/next/intl'

const conf = require('@core/config')
const { getByCondition } = require('@core/keystone/schema')

const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

const {
    TICKET_ASSIGNEE_CONNECTED_TYPE,
    TICKET_EXECUTOR_CONNECTED_TYPE,
    TICKET_STATUS_IN_PROGRESS,
    TICKET_STATUS_COMPLETED,
    TICKET_STATUS_RETURNED,
    TICKET_INDICATOR_ADDED,
    TICKET_INDICATOR_REMOVED,
    TICKET_COMMENT_ADDED,
} = require('@condo/domains/notification/constants/constants')

const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Ticket } = require('./serverSchema')

const ASSIGNEE_CONNECTED_EVENT_TYPE = 'ASSIGNEE_CONNECTED'
const EXECUTOR_CONNECTED_EVENT_TYPE = 'EXECUTOR_CONNECTED'
const STATUS_CHANGED_EVENT_TYPE = 'STATUS_CHANGED'
const WARRANTY_CHANGED_EVENT_TYPE = 'WARRANTY_CHANGED'
const PAID_CHANGED_EVENT_TYPE = 'PAID_CHANGED'
const EMERGENCY_CHANGED_EVENT_TYPE = 'EMERGENCY_CHANGED'

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
    const prevPaid = !isCreateOperation && get(existingItem, 'isPaid')
    const prevEmergency = !isCreateOperation && get(existingItem, 'isEmergency')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const areBothSame = nextAssigneeId === nextExecutorId
    const isAssigneeAdded = isCreateOperation && !!nextAssigneeId
    const isAssigneeUpdated = isUpdateOperation && !!nextAssigneeId && nextAssigneeId !== prevAssigneeId
    const isExecutorAdded = isCreateOperation && !!nextExecutorId
    const isExecutorUpdated = isUpdateOperation && nextExecutorId && nextExecutorId !== prevExecutorId
    const nextStatusId = get(updatedItem, 'status')
    const isStatusAdded = isCreateOperation && !!nextStatusId
    const isStatusUpdated = isUpdateOperation && nextStatusId && nextStatusId !== prevStatusId
    const nextWarranty = get(updatedItem, 'isWarranty')
    const nextPaid = get(updatedItem, 'isPaid')
    const nextEmergency = get(updatedItem, 'isEmergency')
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
    result[ASSIGNEE_CONNECTED_EVENT_TYPE] = !areBothSame && (isAssigneeAdded || isAssigneeUpdated)

    /**
     * executor connected within create ticket operation or
     * executor connected/changed within update ticket operation
     */
    result[EXECUTOR_CONNECTED_EVENT_TYPE] = isExecutorAdded || isExecutorUpdated

    /**
     * ticket status changed
     */
    result[STATUS_CHANGED_EVENT_TYPE] = isStatusAdded || isStatusUpdated

    /**
     * ticket change warranty indicate
     */
    result[WARRANTY_CHANGED_EVENT_TYPE] = !!client && (isCreateOperation && !!nextWarranty || isUpdateOperation && nextWarranty && nextWarranty !== prevWarranty)

    /**
     * ticket change paid indicate
     */
    result[PAID_CHANGED_EVENT_TYPE] = !!client && (isCreateOperation && !!nextPaid || isUpdateOperation && nextPaid && nextPaid !== prevPaid)

    /**
     * ticket change emergency indicate
     */
    result[EMERGENCY_CHANGED_EVENT_TYPE] = !!client && (isCreateOperation && !!nextEmergency || isUpdateOperation && nextEmergency && nextEmergency !== prevEmergency)

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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const intl = useIntl()
    const IndicatorTypeWarranty = intl.formatMessage({ id: 'notification.messages.indicatorType.warranty' })
    const IndicatorTypePaid = intl.formatMessage({ id: 'notification.messages.indicatorType.paid' })
    const IndicatorTypeEmergency = intl.formatMessage({ id: 'notification.messages.indicatorType.emergency' })

    const eventTypes = detectEventTypes(requestData)
    const { operation, existingItem, updatedItem, context } = requestData
    const isCreateOperation =  operation === 'create'
    const prevAssigneeId = !isCreateOperation && get(existingItem, 'assignee')
    const prevExecutorId = !isCreateOperation && get(existingItem, 'executor')
    const prevStatusId = !isCreateOperation && get(existingItem, 'status')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const nextWarranty = get(updatedItem, 'isWarranty')
    const nextPaid = get(updatedItem, 'isPaid')
    const nextEmergency = get(updatedItem, 'isEmergency')
    const nextStatusId = get(updatedItem, 'status')
    const client = get(updatedItem, 'client')

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
        let type
        switch (nextStatusId) {
            case STATUS_IDS.OPEN:
                type = prevStatusId === STATUS_IDS.COMPLETED && TICKET_STATUS_RETURNED
                break

            case STATUS_IDS.IN_PROGRESS:
                type = TICKET_STATUS_IN_PROGRESS
                break

            case STATUS_IDS.COMPLETED:
                type = TICKET_STATUS_COMPLETED
                break
        }

        if (type) {
            await sendMessage(context, {
                lang,
                to: { user: { id: client } },
                type,
                meta: {
                    dv: 1,
                    data: {
                        ticketId: updatedItem.id,
                        ticketNumber: updatedItem.number,
                        userId: client,
                    },
                },
                sender: updatedItem.sender,
            })
        }
    }

    if (eventTypes[WARRANTY_CHANGED_EVENT_TYPE]) {
        await sendMessage(context, {
            lang,
            to: { user: { id: client } },
            type: !nextWarranty ? TICKET_INDICATOR_ADDED : TICKET_INDICATOR_REMOVED,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId: client,
                    indicatorType: IndicatorTypeWarranty,
                },
            },
            sender: updatedItem.sender,
        })
    }

    if (eventTypes[PAID_CHANGED_EVENT_TYPE]) {
        await sendMessage(context, {
            lang,
            to: { user: { id: client } },
            type: !nextPaid ? TICKET_INDICATOR_ADDED : TICKET_INDICATOR_REMOVED,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId: client,
                    indicatorType: IndicatorTypePaid,
                },
            },
            sender: updatedItem.sender,
        })
    }

    if (eventTypes[EMERGENCY_CHANGED_EVENT_TYPE]) {
        await sendMessage(context, {
            lang,
            to: { user: { id: client } },
            type: !nextEmergency ? TICKET_INDICATOR_ADDED : TICKET_INDICATOR_REMOVED,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId: client,
                    indicatorType: IndicatorTypeEmergency,
                },
            },
            sender: updatedItem.sender,
        })
    }
}

const handleTicketCommentEvents = async (requestData) => {
    const { updatedItem, context } = requestData
    const [ticket] = await Ticket.getAll(context, { id: updatedItem.ticket })
    const client = get(ticket, 'client.id')
    const organizationId = get(ticket, 'organization.id')

    const organization = await getByCondition('Organization', {
        id: organizationId,
        deletedAt: null,
    })

    const lang = get(COUNTRIES, [organization.country, 'locale'], DEFAULT_LOCALE)

    if (client) {
        await sendMessage(context, {
            lang,
            to: { user: { id: client } },
            type: TICKET_COMMENT_ADDED,
            meta: {
                dv: 1,
                data: {
                    ticketId: ticket.id,
                    ticketNumber: ticket.number,
                    userId: client,
                },
            },
            sender: updatedItem.sender,
        })
    }
}

module.exports = {
    handleTicketEvents,
    handleTicketCommentEvents,
    detectEventTypes,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
}