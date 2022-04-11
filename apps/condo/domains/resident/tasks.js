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
async function manageResidentToPropertyAndOrganizationConnections (address) {
    const { keystone: context } = await getSchemaCtx('Property')

    //  get oldest non-deleted property with same address
    const [oldestProperty] = await PropertyAPI.getAll(context, {
        address_i: address,
        deletedAt: null,
    }, {
        sortBy: ['isApproved_ASC', 'createdAt_ASC'], // sorting order is essential here
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

module.exports = {
    manageResidentToPropertyAndOrganizationConnections: createTask('manageResidentToPropertyAndOrganizationConnections', manageResidentToPropertyAndOrganizationConnections),
}
