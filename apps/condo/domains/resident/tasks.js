const { getSchemaCtx } = require('@core/keystone/schema')
const { createTask } = require('@core/keystone/tasks')

const { sleep } = require('@condo/domains/common/utils/sleep')
const { Property: PropertyAPI } = require('@condo/domains/property/utils/serverSchema')
const { Resident: ResidentAPI } = require('@condo/domains/resident/utils/serverSchema')
const { disconnectResidents, connectResidents } = require('@condo/domains/resident/utils/helpers')

/**
 * Reconnects residents to oldest (dominating) non-deleted property with same address
 * on create, delete or restore operation on property with same address, or disconnects
 * residents at all (connects to null) if there are no proper non-deleted property.
 * @param propertyId
 * @returns {Promise<void>}
 */
async function manageResidentToPropertyAndOrganizationConnections (propertyId, address, operationFlags = {}) {
    const { keystone: context } = await getSchemaCtx('Property')

    // NOTE: give synchronous tests some time
    await sleep(500)

    //  get oldest non-deleted property with same address
    const [oldestProperty] = await PropertyAPI.getAll(context, {
        address_i: address,
        deletedAt: null,
    }, {
        sortBy: 'createdAt_ASC', // sorting order is essential here
        first: 1,
    })

    const { isAddressUpdated } = operationFlags
    const shouldConnect = Boolean(oldestProperty)
    const shouldDisconnect = !shouldConnect || isAddressUpdated

    // disconnect should come first, because it's either used alone or together with isAddressUpdated
    // and residents should be disconnected before connecting others to the property
    if (shouldDisconnect) {
        // No oldest property - this is softDelete operation
        // or isAddressUpdated received
        // Get residents with propertyId to disconnect
        const residents = await ResidentAPI.getAll(context, {
            property: { id: propertyId },
        })

        // we have no non-deleted property with such address - disconnect all residents
        await disconnectResidents(context, residents)
    }

    if (shouldConnect) {
        // get all non-deleted residents with same address
        const residents = await ResidentAPI.getAll(context, {
            address_i: address,
            deletedAt: null,
            property: { id_not: oldestProperty.id },
        })

        // we have oldest non-deleted property, reconnect all residents with such address to it
        await connectResidents(context, residents, oldestProperty)
    }

    if (isAddressUpdated) {
        // residents are already detached from propertyId and reattached (if could) to other, matching address
        // here we need to connect residents with matching address to propertyId (which is left alone by now)
        const [property] = await PropertyAPI.getAll(context, { id: propertyId }, { first: 1 })

        await manageResidentToPropertyAndOrganizationConnections(property.id, property.address)
    }
}

module.exports = {
    manageResidentToPropertyAndOrganizationConnections: createTask('manageResidentToPropertyAndOrganizationConnections', manageResidentToPropertyAndOrganizationConnections),
}
