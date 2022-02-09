const get = require('lodash/get')

const { getByCondition } = require('@core/keystone/schema')

const { COUNTRIES, DEFAULT_LOCALE } = require('@condo/domains/common/constants/countries')

const { TICKET_ASSIGNEE_CONNECTED_TYPE, TICKET_EXECUTOR_CONNECTED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const triggerTicketEventActions = async ({ operation, existingItem, updatedItem, context }) => {
    const isCreateOperation =  operation === 'create'
    const isUpdateOperation =  operation === 'update'
    const prevAssigneeId = !isCreateOperation && get(existingItem, 'assignee')
    const prevExecutorId = !isCreateOperation && get(existingItem, 'executor')
    const prevStatusId = !isCreateOperation && get(existingItem, 'status')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const nextStatusId = get(updatedItem, 'status')
    // assignee connected within create ticket operation or
    // assignee connected/changed within update ticket operation
    const isAssigneeConnected = isCreateOperation && nextAssigneeId || isUpdateOperation && nextAssigneeId && nextAssigneeId !== prevAssigneeId
    // executor connected within create ticket operation or
    // executor connected/changed within update ticket operation
    const isExecutorConnected = isCreateOperation && nextExecutorId || isUpdateOperation && nextExecutorId && nextExecutorId !== prevExecutorId
    const isStatusChanged = isCreateOperation && !!nextStatusId || isUpdateOperation && nextStatusId && nextStatusId !== prevStatusId

    const organization = await getByCondition('Organization', {
        id: updatedItem.organization,
        deletedAt: null,
    })

    const lang = COUNTRIES[organization.country].locale || DEFAULT_LOCALE

    if (isAssigneeConnected) {
        await sendMessage(context, {
            lang,
            to: { user: { id: nextAssigneeId || prevAssigneeId } },
            type: TICKET_ASSIGNEE_CONNECTED_TYPE,
            meta: {
                dv: 1,
                ticketId: updatedItem.id,
                ticketNumber: updatedItem.number,
                userId: nextAssigneeId || prevAssigneeId,
            },
            sender: updatedItem.sender,
        })
    }

    if (false && isExecutorConnected) {
        await sendMessage(context, {
            lang,
            to: { user: { id: nextExecutorId || prevExecutorId } },
            type: TICKET_EXECUTOR_CONNECTED_TYPE,
            meta: {
                dv: 1,
                ticketId: updatedItem.id,
                ticketNumber: updatedItem.number,
                userId: nextAssigneeId || prevAssigneeId,
            },
            sender: updatedItem.sender,
        })
    }

    console.log('triggerTicketEventActions:', { operation, isStatusChanged, prevStatusId, nextStatusId })
}

module.exports = {
    triggerTicketEventActions,
}