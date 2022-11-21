const dayjs = require('dayjs')

const { createCronTask } = require('@open-condo/keystone/tasks')
const { getSchemaCtx, find } = require('@open-condo/keystone/schema')
const { getLogger } = require('@open-condo/keystone/logging')

const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

const appLogger = getLogger('condo')
const taskLogger = appLogger.child({ module: 'closeCompletedTickets' })

/**
 * Closes tickets that are in the "completed" status for 7 days
 */
const closeCompletedTickets = async () => {
    const { keystone } = await getSchemaCtx('Ticket')
    const adminContext = await keystone.createContext({ skipAccessControl: true })
    const weekAgo = dayjs().startOf('day').subtract('7', 'day').toISOString()

    const ticketsToChange = await find('Ticket', {
        status: { id: STATUS_IDS.COMPLETED },
        statusUpdatedAt_lte: weekAgo,
        deletedAt: null,
    })

    for (const ticket of ticketsToChange) {
        try {
            await Ticket.update(adminContext, ticket.id, {
                status: { connect: { id: STATUS_IDS.CLOSED } },
                dv: 1,
                sender: { fingerprint: 'auto-close', dv: 1 },
            })
        } catch (error) {
            taskLogger.error({
                msg: 'Failed to close Ticket',
                data: { id: ticket.id },
                error,
            })
        }
    }
}

module.exports = {
    closeCompletedTickets: createCronTask('closeCompletedTickets', '0 1 * * *', closeCompletedTickets),
}
