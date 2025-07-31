const { get, isEmpty, isNull } = require('lodash')

const conf = require('@open-condo/config')

const { Resident: ResidentAPI } = require('@condo/domains/resident/utils/serverSchema')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const {
    RESIDENT_FIND_ORGANIZATIONS_WINDOW_SEC,
    MAX_RESIDENT_FIND_ORGANIZATIONS_BY_WINDOW_SEC,
} = require('../constants/constants')

/**
 * Connects or disconnects residents to/from organization & property.
 * Property should be provided to connect.
 * In other case residents will be disconnected.
 * @param context (context)
 * @param residents (Resident[])
 * @param property (Property)
 * @returns {Promise<void>}
 */
const connectResidents = async (context, residents, property, dv, sender) => {
    // Nothing to connect
    if (!Array.isArray(residents) || isEmpty(residents)) return

    const propertyId = get(property, 'id')
    const shouldConnect = Boolean(property) && propertyId
    const attrs = {
        dv,
        sender,
        property: shouldConnect ? { connect: { id: propertyId } } : { disconnectAll: true },
    }

    for (const resident of residents) {
        // Already disconnected resident
        if (!shouldConnect && isNull(resident.property)) continue
        // Resident is already connected to the property
        if (shouldConnect && get(resident, 'property') === propertyId) continue

        await ResidentAPI.update(context, get(resident, 'id'), attrs)
    }
}

/**
 * Disconnects residents from their organization and property each
 * @param context (context)
 * @param residents (Resident[])
 * @returns {Promise<void>}
 */
const disconnectResidents = async (context, residents, dv, sender) => await connectResidents(context, residents, null, dv, sender)


async function checkResidentRequestLimits (key, context, windowInSeconds, requestsLimitCount ) {
    const redisGuard = new RedisGuard()

    const userId = get(context, ['authedItem', 'id'])
    const envLimits = conf['RESIDENT_REQUESTS_LIMITS'] ? JSON.parse(conf['RESIDENT_REQUESTS_LIMITS']) : {}
    if (envLimits.hasOwnProperty(key)) {
        requestsLimitCount = envLimits[key]
    }
    await redisGuard.checkCustomLimitCounters(
        `${key}:${userId}`,
        windowInSeconds,
        requestsLimitCount,
        context,
    )
}

module.exports = {
    connectResidents,
    disconnectResidents,
    checkResidentRequestLimits,
}
