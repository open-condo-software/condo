const get = require('lodash/get')
const dayjs = require('dayjs')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')
const { NOT_FOUND_ERROR } = require('@condo/domains/common/constants/errors')

dayjs.extend(isSameOrBefore)

/**
 * Connects or disconnects residents to/from organization & property.
 * Property should be provided to connect.
 * In other case residents will be disconnected.
 * @param ResidentAPI (API) either Server or Test API
 * @param context (context)
 * @param residents (Resident[])
 * @param property (Property)
 * @param reconnectToOlder (boolean) forces reconnecting residents with non-deleted property to restored older one
 * @returns {Promise<void>}
 */
const connectResidents = async (ResidentAPI, context, residents, property, reconnectToOlder = false) => {
    const propertyId = get(property, 'id')
    const shouldConnect = Boolean(property) && propertyId
    const organizationId = shouldConnect ? property.organization.id : null
    const organizationConnect = shouldConnect ? { connect: { id: organizationId } } : { disconnectAll: true }
    const propertyConnect = shouldConnect ? { connect: { id: propertyId } } : { disconnectAll: true }

    // Nothing to connect
    if (!Array.isArray(residents)) return

    for (const resident of residents) {
        const residentId = get(resident, 'id')

        if (shouldConnect) {
            // NOTE: for optimization sake, we decide here if property should be switched, by calculating which property is older, current or next one
            const residentProperty = get(resident, 'property')
            const currCreatedAt = get(residentProperty, 'createdAt')
            const currDeletedAt = get(residentProperty, 'deletedAt')

            // NOTE: do not reconnect residents with non-deleted property at all, because of reconnectToOlder === false
            if (residentProperty && !reconnectToOlder && !currDeletedAt) break

            // NOTE: we need createdAt to make decision about connecting or not resident to other property
            if (residentProperty && !currCreatedAt) console.error(`${NOT_FOUND_ERROR}createdAt] 'resident.property.createdAt' is missing`)

            // NOTE: resident already has non-deleted property and it's older than property.createdAt
            if (residentProperty && !currDeletedAt && currCreatedAt && dayjs(currCreatedAt).isSameOrBefore(dayjs(property.createdAt))) break
        }

        const attrs = {
            property: propertyConnect,
            organization: organizationConnect,
        }

        await ResidentAPI.update(context, residentId, attrs)
    }
}

/**
 * Disconnects residents from their organization and property each
 * @param context (context)
 * @param residents (Resident[])
 * @returns {Promise<void>}
 */
const disconnectResidents = async (ResidentAPI, context, residents) => await connectResidents(ResidentAPI, context, residents, null)

module.exports = {
    connectResidents,
    disconnectResidents,
}
