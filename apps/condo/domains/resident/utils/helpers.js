const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const dayjs = require('dayjs')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')

const { NOT_FOUND_ERROR } = require('@condo/domains/common/constants/errors')
const { Resident: ResidentAPI } = require('@condo/domains/resident/utils/serverSchema')

dayjs.extend(isSameOrBefore)

/**
 * Connects or disconnects residents to/from organization & property.
 * Property should be provided to connect.
 * In other case residents will be disconnected.
 * @param context (context)
 * @param residents (Resident[])
 * @param property (Property)
 * @returns {Promise<void>}
 */
const connectResidents = async (context, residents, property) => {
    // Nothing to connect
    if (!Array.isArray(residents) || isEmpty(residents)) return
    
    const propertyId = get(property, 'id')
    const shouldConnect = Boolean(property) && propertyId
    const organizationConnect = shouldConnect ? { connect: { id: property.organization.id } } : { disconnectAll: true }
    const propertyConnect = shouldConnect ? { connect: { id: propertyId } } : { disconnectAll: true }
    const attrs = {
        property: propertyConnect,
        organization: organizationConnect,
    }

    for (const resident of residents) {
        if (shouldConnect) {
            // NOTE: for optimization sake, we decide here if property should be switched, by calculating which property is older, current or next one
            const residentProperty = get(resident, 'property')
            const currCreatedAt = get(residentProperty, 'createdAt')
            const currDeletedAt = get(residentProperty, 'deletedAt')

            // NOTE: we need createdAt to make decision about connecting the resident to other property or not
            if (residentProperty && !currCreatedAt) console.error(`${NOT_FOUND_ERROR}createdAt] 'resident.property.createdAt' is missing`)

            // NOTE: resident already has non-deleted property and it's createdAt isSameOrBefore than property.createdAt
            if (residentProperty && !currDeletedAt && currCreatedAt && dayjs(currCreatedAt).isSameOrBefore(dayjs(property.createdAt))) break
        }

        const residentId = get(resident, 'id')

        await ResidentAPI.update(context, residentId, attrs)
    }
}

/**
 * Disconnects residents from their organization and property each
 * @param context (context)
 * @param residents (Resident[])
 * @returns {Promise<void>}
 */
const disconnectResidents = async (context, residents) => await connectResidents(context, residents, null)

module.exports = {
    connectResidents,
    disconnectResidents,
}
