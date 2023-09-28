const get = require('lodash/get')

const { getSchemaCtx, getById, find } = require('@open-condo/keystone/schema')

const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const { RESIDENT } = require('@condo/domains/user/constants/common')


// NOTE: This task is called when Resident is created, which increases the connectivity of the Resident and Ticket domains
//       It's can cause difficulties when dividing the app into services.
/**
 * Connects resident user to tickets whose phone number matches the ticket contact's phone number and address matches the ticket address
 * @param propertyId {string} Resident property id
 * @param unitType {string} Resident unitType
 * @param unitName: {string} Resident unitName
 * @param userId: {string} Resident user id
 * @returns {Promise<void>}
 */
async function actualizeTicketToResidentUserConnections (propertyId, unitType, unitName, userId, dv, sender) {
    const { keystone } = await getSchemaCtx('Message')

    const residentUser = await getById('User', userId)
    const residentUserPhone = get(residentUser, 'phone', null)

    if (!residentUserPhone || residentUser.type !== RESIDENT) return

    const tickets = await find('Ticket', {
        client_is_null: true,
        property: { id: propertyId },
        contact: { phone: residentUserPhone },
        unitName: unitName,
        unitType: unitType,
    })

    for (const ticket of tickets) {
        await Ticket.update(keystone, ticket.id, {
            dv,
            sender,
            client: { connect: { id: userId } },
        })
    }
}

module.exports = {
    actualizeTicketToResidentUserConnections,
}
