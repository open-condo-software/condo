const dayjs = require('dayjs')
const { find } = require('@core/keystone/schema')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

async function closeCompletedTickets (context) {
    const today = dayjs().startOf('day').toISOString()

    const ticketsToChange = await find('Ticket', {
        status: { id: STATUS_IDS.COMPLETED },
        statusUpdatedAt_lte: today,
        deletedAt: null,
    })

    for (const ticket of ticketsToChange) {
        await Ticket.update(context, ticket.id, {
            status: { connect: { id: STATUS_IDS.CLOSED } },
        })
    }
}

module.exports = closeCompletedTickets