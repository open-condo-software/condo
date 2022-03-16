const { find, getSchemaCtx } = require('@core/keystone/schema')
const { createTask, createCronTask } = require('@core/keystone/tasks')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const dayjs = require('dayjs')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

/**
 * Launched when address of some property was changed to sync propertyAddress field of all linked tickets
 * by running Ticket.update with no extra attrs
 * In this case resolveInput of ticket will update propertyAddress and propertyAddressMeta automatically
 * @param propertyId property id
 * @param userInfo object containing "dv" and "sender" fields
 * @returns {Promise<void>}
 */
async function manageTicketPropertyAddressChange (propertyId, userInfo) {
    const { keystone: context } = await getSchemaCtx('Property')

    const ticketsToChange = await find('Ticket', {
        property: { id: propertyId },
        deletedAt: null,
    })

    for (const ticket of ticketsToChange) {
        await Ticket.update(context, ticket.id, {
            ...userInfo,
        })
    }
}

/**
 * Closes tickets that are in the "completed" status for 7 days
 */
const closeCompletedTickets = createCronTask('closeCompletedTickets', '0 1 * * *', async () => {
    const today = dayjs().format('YYYY-MM-DD').toISOString()
    const {  keystone: context } = await getSchemaCtx('User')

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
})

module.exports = {
    manageTicketPropertyAddressChange: createTask('manageTicketPropertyAddressChange', manageTicketPropertyAddressChange),
    closeCompletedTickets,
}