const { createCronTask } = require('@core/keystone/tasks')
const { getSchemaCtx, find } = require('@core/keystone/schema')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const dayjs = require('dayjs')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

/**
 * Opens tickets that are in the "deferred" status and the date they are deferring has expired.
 * And resets the executor and assignee of this ticket
 */
const reopenDeferredTicketsTask = createCronTask('reopenDeferredTickets', '0 0 * * *', async () => {
    const { keystone } = await getSchemaCtx('Ticket')
    const adminContext = await keystone.createContext({ skipAccessControl: true })
    const currentDate = dayjs().startOf('day').toISOString()

    const ticketsToChange = await find('Ticket', {
        status: { id: STATUS_IDS.DEFERRED },
        deferredUntil_lte: currentDate,
        deletedAt: null,
    })

    for (const ticket of ticketsToChange) {
        await Ticket.update(adminContext, ticket.id, {
            dv: 1,
            sender: { fingerprint: 'auto-reopen', dv: 1 },
            executor: { disconnectAll: true },
            assignee: { disconnectAll: true },
            status: { connect: { id: STATUS_IDS.OPEN } },
        })
    }
})

module.exports = reopenDeferredTicketsTask