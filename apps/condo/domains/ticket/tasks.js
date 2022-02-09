const { find, getSchemaCtx } = require('@core/keystone/schema')
const { createTask } = require('@core/keystone/tasks')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

/**
 * Launched when address of some property was changed to sync propertyAddress field of all linked tickets
 * @param propertyId
 * @param newAddress
 * @returns {Promise<void>}
 */
async function manageTicketPropertyAddressChange (propertyId, newAddress) {
    const { keystone: context } = await getSchemaCtx('Property')

    const ticketsToChange = await find('Ticket', {
        property: { id: propertyId },
    })
    for (const ticket of ticketsToChange) {
        await Ticket.update(context, ticket.id, {
            propertyAddress: newAddress,
        })
    }
}

module.exports = {
    manageTicketPropertyAddressChange: createTask('manageTicketPropertyAddressChange', manageTicketPropertyAddressChange),
}