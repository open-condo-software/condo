const { createCronTask } = require('@core/keystone/tasks')
const { getSchemaCtx, find } = require('@core/keystone/schema')
const dayjs = require('dayjs')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

/**
 * Closes tickets that are in the "completed" status for 7 days
 */
const closeCompletedTicketsTask = createCronTask('closeCompletedTickets', '0 1 * * *', async () => {
    const { keystone } = await getSchemaCtx('Ticket')
    const adminContext = await keystone.createContext({ skipAccessControl: true })
    const weekAgo = dayjs().startOf('day').subtract('7', 'day').toISOString()

    const ticketsToChange = await find('Ticket', {
        status: { id: STATUS_IDS.COMPLETED },
        statusUpdatedAt_lte: weekAgo,
        deletedAt: null,
    })

    for (const ticket of ticketsToChange) {
        await Ticket.update(adminContext, ticket.id, {
            status: { connect: { id: STATUS_IDS.CLOSED } },
            dv: 1,
            sender: { fingerprint: 'auto-close', dv: 1 },
        })
    }
})

module.exports = closeCompletedTicketsTask