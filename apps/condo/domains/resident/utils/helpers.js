const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const isNull = require('lodash/isNull')
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
    const attrs = {
        property: shouldConnect ? { connect: { id: propertyId } } : { disconnectAll: true },
        organization: shouldConnect ? { connect: { id: property.organization.id } } : { disconnectAll: true },
    }

    for (const resident of residents) {
        // Already disconnected resident
        if (!shouldConnect && isNull(resident.property)) continue
        // Resident is already connected to the property
        if (shouldConnect && get(resident, 'property.id') === propertyId) continue

        await ResidentAPI.update(context, get(resident, 'id'), attrs)
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
