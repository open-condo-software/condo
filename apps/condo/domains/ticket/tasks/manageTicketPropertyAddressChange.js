const { getSchemaCtx, find } = require('@open-condo/keystone/schema')

const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')

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

module.exports = {
    manageTicketPropertyAddressChange,
}
