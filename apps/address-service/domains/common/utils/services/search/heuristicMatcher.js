const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const {
    Address: AddressServerUtils,
    AddressHeuristic: AddressHeuristicServerUtils,
} = require('@address-service/domains/address/utils/serverSchema')
const {
    COORDINATE_TOLERANCE,
    parseCoordinates,
    CoordinateHeuristicStrategy,
    getHeuristicStrategy,
} = require('@address-service/domains/common/utils/services/search/heuristicStrategies')

const logger = getLogger('heuristicMatcher')

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
    return await new CoordinateHeuristicStrategy().findConflicts(`${lat},${lon}`, tolerance)
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
 * Find an existing Address by matching any of the provided heuristics.
 * Searches heuristics sorted by reliability (highest first).
 * Each heuristic type delegates conflict detection to its strategy.
 *
 * @param {Array<{type: string, value: string, reliability: number, meta?: object}>} heuristics
 * @returns {Promise<{addressId: string, matchedHeuristic: {type: string, value: string}}|null>}
 */
async function findAddressByHeuristics (heuristics) {
    const sorted = [...heuristics].sort((a, b) => b.reliability - a.reliability)

    for (const heuristic of sorted) {
        const strategy = getHeuristicStrategy(heuristic.type)
        const matches = await strategy.findConflicts(heuristic.value)

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
        logger.warn({ msg: 'possibleDuplicateOf chain exceeded max depth', data: { addressId, maxDepth } })
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
        const strategy = getHeuristicStrategy(heuristic.type)
        const existingRecords = await strategy.findConflicts(heuristic.value)

        if (existingRecords.length > 0) {
            const existingAddressId = existingRecords[0].address

            if (existingAddressId === addressId) {
                // Same address — skip
                continue
            }

            // Different address — potential conflict.
            // Delegate veto logic to the strategy (only coordinate heuristics may be vetoed).
            const vetoed = await strategy.isConflictVetoed(existingAddressId, heuristic, heuristics)
            if (vetoed) {
                logger.info({
                    msg: 'Conflict vetoed by higher-reliability heuristic disagreement — addresses are distinct',
                    data: { existingAddressId, newAddressId: addressId, heuristic, incomingHeuristics: heuristics },
                })
                toCreate.push(heuristic)
                continue
            }

            logger.warn({
                msg: 'Heuristic conflict detected',
                data: {
                    type: heuristic.type,
                    value: heuristic.value,
                    existingAddressId,
                    newAddressId: addressId,
                },
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
        const strategy = getHeuristicStrategy(heuristic.type)
        const createData = {
            ...dvSender,
            address: { connect: { id: addressId } },
            type: heuristic.type,
            value: heuristic.value,
            reliability: heuristic.reliability,
            provider: providerName,
            meta: heuristic.meta || null,
            enabled: true,
            ...strategy.buildExtraFields(heuristic.value),
        }

        try {
            await AddressHeuristicServerUtils.create(context, createData)
        } catch (err) {
            // Concurrent request may insert the same (type, value) between our
            // first-pass read and create. Re-check and convert to duplicate link.
            if (!isAddressHeuristicUniqueViolation(err)) {
                throw err
            }

            const existingRecords = await strategy.findConflicts(heuristic.value)
            if (existingRecords.length === 0) {
                throw err
            }

            const existingAddressId = existingRecords[0].address
            if (existingAddressId !== addressId) {
                const vetoed = await strategy.isConflictVetoed(existingAddressId, heuristic, heuristics)
                if (vetoed) {
                    logger.info({
                        msg: 'Race conflict vetoed by higher-reliability heuristic disagreement — addresses are distinct',
                        data: { existingAddressId, newAddressId: addressId, heuristic, incomingHeuristics: heuristics },
                    })
                } else {
                    logger.warn({
                        msg: 'Heuristic conflict detected during create (race)',
                        data: {
                            type: heuristic.type,
                            value: heuristic.value,
                            existingAddressId,
                            newAddressId: addressId,
                        },
                    })

                    // We track the highest reliability conflict found during this race
                    // to ensure we link to the strongest possible root address.
                    if (!bestCreatePhaseConflict || heuristic.reliability > bestCreatePhaseConflict.reliability) {
                        bestCreatePhaseConflict = { existingAddressId, reliability: heuristic.reliability }
                    }
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
        if (rootAddressId === addressId) {
            logger.warn({
                msg: 'Skip possibleDuplicateOf self-link',
                data: { addressId, rootAddressId, bestOverallConflict },
            })
        } else {
            await AddressServerUtils.update(context, addressId, {
                ...dvSender,
                possibleDuplicateOf: { connect: { id: rootAddressId } },
            })
        }
    }
}

module.exports = {
    coordinatesMatch,
    findCoordinateHeuristicsInRange,
    findAddressByHeuristics,
    findRootAddress,
    upsertHeuristics,
}
