const dayjs = require('dayjs')
const { isEmpty, get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { find } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

const CHUNK_SIZE = 50

const taskLogger = getLogger()

const hasEmployee = (id, employees) => id && !employees.some(employee => get(employee, 'user', null) === id)

/**
 * Opens tickets that are in the "deferred" status and the date they are deferring has expired.
 * And resets the executor and assignee of this ticket.
 * The check happens every hour.
 */
const reopenDeferredTickets = async () => {
    const { keystone } = getSchemaCtx('Ticket')
    const context = await keystone.createContext()
    const currentDate = dayjs().toISOString()
    const ticketWhere = {
        status: { id: STATUS_IDS.DEFERRED },
        deferredUntil_lte: currentDate,
        deletedAt: null,
    }

    const countTicketToChange = await Ticket.count(keystone, ticketWhere)

    let changedTicketCounter = 0

    while (countTicketToChange > changedTicketCounter) {
        const ticketsToChange = await Ticket.getAll(keystone,
            ticketWhere,
            'id assignee { id } executor { id } organization { id }',
            { first: CHUNK_SIZE }
        )

        if (isEmpty(ticketsToChange)) break

        changedTicketCounter += ticketsToChange.length
        // TODO(DOMA-4155): Update ticket can break on getOrCreateContactByClientData
        for (const ticket of ticketsToChange) {
            try {
                const updatedData = {
                    dv: 1,
                    sender: { fingerprint: 'auto-reopen', dv: 1 },
                    status: { connect: { id: STATUS_IDS.OPEN } },
                }
                const assigneeId = get(ticket, ['assignee', 'id'])
                const executorId = get(ticket, ['executor', 'id'])
                const organizationId = get(ticket, ['organization', 'id'])

                const employeeIds = []
                if (assigneeId) employeeIds.push(assigneeId)
                if (executorId) employeeIds.push(executorId)

                if (!isEmpty(employeeIds)) {
                    const employees = await find('OrganizationEmployee', {
                        user: { id_in: employeeIds },
                        organization: { id: organizationId },
                        isBlocked: false,
                        deletedAt: null,
                    })

                    if (hasEmployee(assigneeId, employees)) {
                        updatedData.assignee = { disconnectAll: true }
                    }
                    if (hasEmployee(executorId, employees)) {
                        updatedData.executor = { disconnectAll: true }
                    }
                }

                await Ticket.update(context, ticket.id, updatedData)
            } catch (err) {
                taskLogger.error({
                    msg: 'failed to update Ticket',
                    entityId: ticket.id,
                    entity: 'Ticket',
                    err,
                })
            }
        }
    }
}

module.exports = {
    reopenDeferredTicketsCron: createCronTask('reopenDeferredTickets', '0 0/1 * * *', reopenDeferredTickets),
    reopenDeferredTickets,
}
