const { createCronTask } = require('@condo/keystone/tasks')
const { getSchemaCtx } = require('@condo/keystone/schema')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const dayjs = require('dayjs')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const { isEmpty } = require('lodash')

const CHUNK_SIZE = 50

/**
 * Opens tickets that are in the "deferred" status and the date they are deferring has expired.
 * And resets the executor and assignee of this ticket.
 * The check happens every hour.
 */
const reopenDeferredTickets = async () => {
    const { keystone } = await getSchemaCtx('Ticket')
    const adminContext = await keystone.createContext({ skipAccessControl: true })
    const currentDate = dayjs().toISOString()
    const ticketWhere = {
        status: { id: STATUS_IDS.DEFERRED },
        deferredUntil_lte: currentDate,
        deletedAt: null,
    }

    const countTicketToChange = await Ticket.count(keystone, ticketWhere)

    let changedTicketCounter = 0

    while (countTicketToChange > changedTicketCounter) {
        const ticketsToChange = await Ticket.getAll(keystone, ticketWhere, { first: CHUNK_SIZE })

        if (isEmpty(ticketsToChange)) break

        changedTicketCounter += ticketsToChange.length

        for (const ticket of ticketsToChange) {
            await Ticket.update(adminContext, ticket.id, {
                dv: 1,
                sender: { fingerprint: 'auto-reopen', dv: 1 },
                executor: { disconnectAll: true },
                assignee: { disconnectAll: true },
                status: { connect: { id: STATUS_IDS.OPEN } },
            })
        }
    }
}

module.exports = {
    reopenDeferredTickets: createCronTask('reopenDeferredTickets', '0 0/1 * * *', reopenDeferredTickets),
}
