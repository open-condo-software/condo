const { find } = require('@open-condo/keystone/schema')

const { HEURISTIC_TYPE_COORDINATES } = require('@address-service/domains/common/constants/heuristicTypes')
const { AbstractHeuristicStrategy } = require('@address-service/domains/common/utils/services/search/heuristicStrategies/AbstractHeuristicStrategy')

// Configurable tolerance for coordinate matching (~1.1m at equator)
const COORDINATE_TOLERANCE = 0.00001

/**
 * Parse a "lat,lon" string into { latitude, longitude } numbers.
 * Returns null if the string is invalid.
 * @param {string} coordString - "lat,lon"
 * @returns {{latitude: number, longitude: number}|null}
 */
const NUMERIC_RE = /^-?\d+(\.\d+)?$/

function parseCoordinates (coordString) {
    if (!coordString || typeof coordString !== 'string') return null
    const parts = coordString.trim().split(',')
    if (parts.length !== 2) return null
    const [rawLat, rawLon] = parts
    if (!NUMERIC_RE.test(rawLat) || !NUMERIC_RE.test(rawLon)) return null
    const lat = Number(rawLat)
    const lon = Number(rawLon)
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null
    return { latitude: lat, longitude: lon }
}

/**
 * Strategy for coordinate heuristics.
 * Conflicts are detected via fuzzy range query on latitude/longitude.
 * Conflicts may be vetoed when a higher-reliability heuristic disagrees.
 */
class CoordinateHeuristicStrategy extends AbstractHeuristicStrategy {
    constructor () {
        super(HEURISTIC_TYPE_COORDINATES)
    }

    async findConflicts (value) {
        const coords = parseCoordinates(value)
        if (!coords) return []
        return await find('AddressHeuristic', {
            type: HEURISTIC_TYPE_COORDINATES,
            enabled: true,
            deletedAt: null,
            latitude_gte: String(coords.latitude - COORDINATE_TOLERANCE),
            latitude_lte: String(coords.latitude + COORDINATE_TOLERANCE),
            longitude_gte: String(coords.longitude - COORDINATE_TOLERANCE),
            longitude_lte: String(coords.longitude + COORDINATE_TOLERANCE),
        })
    }

    buildExtraFields (value) {
        const coords = parseCoordinates(value)
        if (!coords) return {}
        return {
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
        }
    }

    /**
     * Veto this coordinate conflict if the incoming set contains a higher-reliability
     * heuristic that disagrees with the corresponding heuristic on the existing address.
     * In that case the coordinate overlap is a provider inaccuracy — the addresses are
     * genuinely distinct buildings.
     */
    async isConflictVetoed (existingAddressId, thisHeuristic, allIncoming) {
        const higherReliability = allIncoming.filter(
            (h) => h.type !== HEURISTIC_TYPE_COORDINATES && h.reliability > thisHeuristic.reliability
        )
        if (higherReliability.length === 0) return false

        for (const incoming of higherReliability) {
            // Does the existing address already have a heuristic of this higher-reliability type
            // with a different value than what is coming in? If so, the two addresses are
            // genuinely distinct — the coordinate overlap is a provider inaccuracy.
            const existingRecords = await find('AddressHeuristic', {
                address: { id: existingAddressId },
                type: incoming.type,
                deletedAt: null,
                enabled: true,
            })

            if (existingRecords.some((r) => r.value !== incoming.value)) {
                return true
            }
        }

        return false
    }
}

module.exports = {
    COORDINATE_TOLERANCE,
    parseCoordinates,
    CoordinateHeuristicStrategy,
}
