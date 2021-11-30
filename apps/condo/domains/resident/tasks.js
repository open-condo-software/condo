const { getSchemaCtx } = require('@core/keystone/schema')
const { Property: PropertyAPI } = require('@condo/domains/property/utils/serverSchema')
const { Resident: ResidentAPI } = require('@condo/domains/resident/utils/serverSchema')
const { disconnectResidents, connectResidents } = require('@condo/domains/resident/utils/helpers')
const { createTask } = require('@core/keystone/tasks')

/**
 * Reconnects residents to oldest (dominating) non-deleted property with same address
 * on create, delete or restore operation on property with same address, or disconnects
 * residents at all (connects to null) if there are no proper non-deleted property.
 * @param propertyId
 * @returns {Promise<void>}
 */
async function manageResidentToPropertyAndOrganizationConnections (propertyId) {
    const { keystone: context } = await getSchemaCtx('Property')
    const [property] = await PropertyAPI.getAll(context, { id: propertyId }, { first: 1 })

    //  get oldest non-deleted property with same address
    const [oldestProperty] = await PropertyAPI.getAll(context, {
        address_starts_with: property.address,
        deletedAt: null,
    }, {
        sortBy: 'createdAt_ASC', // sorting order is essential here
        first: 1,
    })

    // get all non-deleted residents with same address
    const residents = await ResidentAPI.getAll(context, {
        address_starts_with: property.address,
        deletedAt: null,
    })

    if (oldestProperty) {
        // we have oldest non-deleted property, reconnect all residents with such address to it
        await connectResidents(ResidentAPI, context, residents, oldestProperty, true)
    } else {
        // we have no non-deleted property with such address - disconnect all residents
        await disconnectResidents(ResidentAPI, context, residents)
    }
}

module.exports = {
    manageResidentToPropertyAndOrganizationConnections: createTask('manageResidentToPropertyAndOrganizationConnections', manageResidentToPropertyAndOrganizationConnections),
}
