const get = require('lodash/get')

const { getSchemaCtx, getById, find } = require('@core/keystone/schema')
const { createTask } = require('@core/keystone/tasks')

const { sleep } = require('@condo/domains/common/utils/sleep')

const { Property: PropertyAPI } = require('@condo/domains/property/utils/serverSchema')
const { Resident: ResidentAPI } = require('@condo/domains/resident/utils/serverSchema')
const { disconnectResidents, connectResidents } = require('@condo/domains/resident/utils/helpers')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const { RESIDENT } = require('@condo/domains/user/constants/common')

/**
 * Reconnects residents to oldest (dominating) non-deleted property with same address
 * on create, delete or restore operation on property with same address, or disconnects
 * residents at all (connects to null) if there are no proper non-deleted property.
 * @param propertyId
 * @returns {Promise<void>}
 */
async function manageResidentToPropertyAndOrganizationConnections (address) {
    const { keystone: context } = await getSchemaCtx('Property')

    //  get oldest non-deleted property with same address
    const [oldestProperty] = await PropertyAPI.getAll(context, {
        address_i: address,
        deletedAt: null,
    }, {
        sortBy: 'createdAt_ASC', // sorting order is essential here
        first: 1,
    })

    // This task affects those tests, which somehow connected with property creation, deletion, restoration and address update
    // that causes resident reconnections. So we have to wait here, so that old tests like Meter or MeterReading one
    // can finish their standard flow, after property created/updated but before residents reconnected.
    await sleep(500)

    if (oldestProperty) {
        const residents = await ResidentAPI.getAll(context, {
            address_i: address,
            deletedAt: null,
            property: { OR: [{ id_not: oldestProperty.id }, { id: null }] },
        })

        // Disconnect residents before reconnecting
        await disconnectResidents(context, residents)
        // We have residents, not connected to oldest non-deleted property
        // They should be reconnected to oldestProperty
        await connectResidents(context, residents, oldestProperty)
    } else {
        const residents = await ResidentAPI.getAll(context, {
            address_i: address,
            deletedAt: null,
        })

        // We have no non-deleted properties with such address
        // All residents with such address should be disconnected
        await disconnectResidents(context, residents)
    }
}

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
async function manageResidentToTicketClientConnections (propertyId, unitType, unitName, userId) {
    const { keystone } = await getSchemaCtx('Message')

    const residentUser = await getById('User', userId)
    const residentUserPhone = get(residentUser, 'phone', null)
    const residentUserName = get(residentUser, 'name', null)
    const residentUserEmail = get(residentUser, 'email', null)

    if (!residentUserPhone || residentUser.type !== RESIDENT) return

    const tickets = await find('Ticket', {
        property: { id: propertyId },
        contact: { phone: residentUserPhone },
        unitName: unitName,
        unitType: unitType,
    })

    for (const ticket of tickets) {
        await Ticket.update(keystone, ticket.id, {
            dv: 1,
            sender: { dv: 1, fingerprint: 'connect-resident-to-client' },
            client: { connect: { id: userId } },
            clientName: residentUserName,
            clientPhone: residentUserPhone,
            clientEmail: residentUserEmail,
        })
    }
}

module.exports = {
    manageResidentToPropertyAndOrganizationConnections: createTask('manageResidentToPropertyAndOrganizationConnections', manageResidentToPropertyAndOrganizationConnections),
    manageResidentToTicketClientConnections: createTask('manageResidentToTicketClientConnections', manageResidentToTicketClientConnections),
}
