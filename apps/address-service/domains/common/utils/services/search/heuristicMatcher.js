const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const {
    Address: AddressServerUtils,
    AddressHeuristic: AddressHeuristicServerUtils,
} = require('@address-service/domains/address/utils/serverSchema')
const { HEURISTIC_TYPE_COORDINATES } = require('@address-service/domains/common/constants/heuristicTypes')

const logger = getLogger('heuristicMatcher')

// Configurable tolerance for coordinate matching (~1.1m at equator)
const COORDINATE_TOLERANCE = 0.00001

/**
 * Parse a "lat,lon" string into { latitude, longitude } numbers.
 * Returns null if the string is invalid.
 * @param {string} coordString - "lat,lon"
 * @returns {{latitude: number, longitude: number}|null}
 */
function parseCoordinates (coordString) {
    const [lat, lon] = coordString.split(',').map(parseFloat)
    if (isNaN(lat) || isNaN(lon)) return null
    return { latitude: lat, longitude: lon }
}

/**
 * @param {{ type: string, value: string }} heuristic
 * @returns {Promise<Array>}
 */
async function findExistingHeuristicsForConflict (heuristic) {
    if (heuristic.type === HEURISTIC_TYPE_COORDINATES) {
        const coords = parseCoordinates(heuristic.value)
        if (!coords) return []
        return await findCoordinateHeuristicsInRange(coords.latitude, coords.longitude)
    }

    return await find('AddressHeuristic', {
        type: heuristic.type,
        value: heuristic.value,
        deletedAt: null,
        enabled: true,
    })
}

/**
 * @param {Error & { code?: string, originalError?: { code?: string }, nativeError?: { code?: string } }} err
 * @returns {boolean}
 */
function isAddressHeuristicUniqueViolation (err) {
    const errorCode = err?.code || err?.originalError?.code || err?.nativeError?.code
    const message = String(err?.message || '')

    // PostgreSQL SQLSTATE 23505 = unique_violation.
    // We also match by our partial unique index name
    // "addressheuristic_type_value_unique" on (type, value) where deletedAt is null
    // in case the driver wraps/normalizes error codes.
    return errorCode === '23505' || message.includes('addressheuristic_type_value_unique')
}

/**
 * Check if two coordinate strings are within tolerance
 * @param {string} coord1 - "lat,lon"
 * @param {string} coord2 - "lat,lon"
 * @param {number} [tolerance=COORDINATE_TOLERANCE]
 * @returns {boolean}
 */
function coordinatesMatch (coord1, coord2, tolerance = COORDINATE_TOLERANCE) {
    const c1 = parseCoordinates(coord1)
    const c2 = parseCoordinates(coord2)
    if (!c1 || !c2) return false

    return Math.abs(c1.latitude - c2.latitude) <= tolerance &&
           Math.abs(c1.longitude - c2.longitude) <= tolerance
}

/**
 * Find coordinate heuristics within tolerance using DB range queries on latitude/longitude.
 * @param {number} lat
 * @param {number} lon
 * @param {number} [tolerance=COORDINATE_TOLERANCE]
 * @returns {Promise<Array>}
 */
async function findCoordinateHeuristicsInRange (lat, lon, tolerance = COORDINATE_TOLERANCE) {
    return await find('AddressHeuristic', {
        type: HEURISTIC_TYPE_COORDINATES,
        enabled: true,
        deletedAt: null,
        latitude_gte: String(lat - tolerance),
        latitude_lte: String(lat + tolerance),
        longitude_gte: String(lon - tolerance),
        longitude_lte: String(lon + tolerance),
    })
}

/**
 * Find an existing Address by matching any of the provided heuristics.
 * Searches heuristics sorted by reliability (highest first).
 * For coordinates, uses fuzzy matching within tolerance.
 *
 * @param {Array<{type: string, value: string, reliability: number, meta?: object}>} heuristics
 * @returns {Promise<{addressId: string, matchedHeuristic: {type: string, value: string}}|null>}
 */
async function findAddressByHeuristics (heuristics) {
    const sorted = [...heuristics].sort((a, b) => b.reliability - a.reliability)

    for (const heuristic of sorted) {
        let matches = []

        if (heuristic.type === HEURISTIC_TYPE_COORDINATES) {
            const coords = parseCoordinates(heuristic.value)
            if (!coords) continue
            matches = await findCoordinateHeuristicsInRange(coords.latitude, coords.longitude)
        } else {
            matches = await find('AddressHeuristic', {
                type: heuristic.type,
                value: heuristic.value,
                enabled: true,
                deletedAt: null,
            })
        }

        if (matches.length > 0) {
            return {
                addressId: matches[0].address,
                matchedHeuristic: { type: heuristic.type, value: heuristic.value },
            }
        }
    }

    return null
}

/**
 * Follow the possibleDuplicateOf chain to find the root address.
 * Prevents cycles by limiting chain depth.
 *
 * @param {string} addressId
 * @param {number} [maxDepth=10]
 * @returns {Promise<string>} - The root address ID
 */
async function findRootAddress (addressId, maxDepth = 10) {
    let currentId = addressId
    let lastAliveId = addressId
    let depth = 0

    while (depth < maxDepth) {
        const [address] = await find('Address', { id: currentId, deletedAt: null })
        if (!address) {
            // Current node is deleted — stop traversal, use last known alive node
            break
        }
        lastAliveId = address.id
        if (!address.possibleDuplicateOf) {
            return lastAliveId
        }
        currentId = address.possibleDuplicateOf
        depth++
    }

    if (depth >= maxDepth) {
        logger.warn({ msg: 'possibleDuplicateOf chain exceeded max depth', addressId, maxDepth })
    }

    return lastAliveId
}

/**
 * Upsert heuristics for an address.
 * For each heuristic:
 *   - If exists with same (type, value) pointing to SAME address → skip
 *   - If not exists → create AddressHeuristic record
 *   - If exists pointing to DIFFERENT address → keep existing, set possibleDuplicateOf on new address
 *
 * @param {Object} context - Keystone context
 * @param {string} addressId - The address to attach heuristics to
 * @param {Array<{type: string, value: string, reliability: number, meta?: object}>} heuristics
 * @param {string} providerName - Provider that generated these heuristics
 * @param {Object} dvSender - { dv, sender } for audit
 * @returns {Promise<void>}
 */
async function upsertHeuristics (context, addressId, heuristics, providerName, dvSender) {
    // First pass: detect conflicts and collect heuristics to create.
    // We pick the single best conflict (highest reliability) so that
    // possibleDuplicateOf is set at most once with a deterministic choice.
    let bestConflict = null
    const toCreate = []

    for (const heuristic of heuristics) {
        const existingRecords = await findExistingHeuristicsForConflict(heuristic)

        if (existingRecords.length > 0) {
            const existingRecord = existingRecords[0]
            const existingAddressId = existingRecord.address

            if (existingAddressId === addressId) {
                // Same address — skip
                continue
            }

            // Different address — conflict
            logger.warn({
                msg: 'Heuristic conflict detected',
                type: heuristic.type,
                value: heuristic.value,
                existingAddressId,
                newAddressId: addressId,
            })

            if (!bestConflict || heuristic.reliability > bestConflict.reliability) {
                bestConflict = { existingAddressId, reliability: heuristic.reliability }
            }

            continue
        }

        // No existing record — queue for creation
        toCreate.push(heuristic)
    }

    // Second pass: create new heuristic records
    let bestCreatePhaseConflict = null

    for (const heuristic of toCreate) {
        const createData = {
            ...dvSender,
            address: { connect: { id: addressId } },
            type: heuristic.type,
            value: heuristic.value,
            reliability: heuristic.reliability,
            provider: providerName,
            meta: heuristic.meta || null,
            enabled: true,
        }

        if (heuristic.type === HEURISTIC_TYPE_COORDINATES) {
            const coords = parseCoordinates(heuristic.value)
            if (coords) {
                createData.latitude = String(coords.latitude)
                createData.longitude = String(coords.longitude)
            }
        }

        try {
            await AddressHeuristicServerUtils.create(context, createData)
        } catch (err) {
            // Concurrent request may insert the same (type, value) between our
            // first-pass read and create. Re-check and convert to duplicate link.
            if (!isAddressHeuristicUniqueViolation(err)) {
                throw err
            }

            const existingRecords = await findExistingHeuristicsForConflict(heuristic)
            if (existingRecords.length === 0) {
                throw err
            }

            const existingAddressId = existingRecords[0].address
            if (existingAddressId !== addressId) {
                logger.warn({
                    msg: 'Heuristic conflict detected during create (race)',
                    type: heuristic.type,
                    value: heuristic.value,
                    existingAddressId,
                    newAddressId: addressId,
                })

                // We track the highest reliability conflict found during this race
                // to ensure we link to the strongest possible root address.
                if (!bestCreatePhaseConflict || heuristic.reliability > bestCreatePhaseConflict.reliability) {
                    bestCreatePhaseConflict = { existingAddressId, reliability: heuristic.reliability }
                }
            }
        }
    }

    // Evaluate both passes: use the highest reliability conflict overall
    // We defer the actual update to the end so we only update possibleDuplicateOf exactly once.
    let bestOverallConflict = bestConflict
    if (bestCreatePhaseConflict) {
        if (!bestOverallConflict || bestCreatePhaseConflict.reliability > bestOverallConflict.reliability) {
            bestOverallConflict = bestCreatePhaseConflict
        }
    }

    if (bestOverallConflict) {
        const rootAddressId = await findRootAddress(bestOverallConflict.existingAddressId)
        await AddressServerUtils.update(context, addressId, {
            ...dvSender,
            possibleDuplicateOf: { connect: { id: rootAddressId } },
        })
    }
}

module.exports = {
    COORDINATE_TOLERANCE,
    parseCoordinates,
    coordinatesMatch,
    findCoordinateHeuristicsInRange,
    findAddressByHeuristics,
    findRootAddress,
    upsertHeuristics,
}
