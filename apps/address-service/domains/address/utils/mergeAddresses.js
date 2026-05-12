const { getLogger } = require('@open-condo/keystone/logging')
const { find, getById } = require('@open-condo/keystone/schema')

const { ensureCoordinateHeuristic } = require('@address-service/domains/address/utils/ensureCoordinateHeuristic')
const { Address, AddressHeuristic, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { HEURISTIC_TYPE_COORDINATES } = require('@address-service/domains/common/constants/heuristicTypes')

const logger = getLogger('mergeAddresses')

/**
 * Merge two addresses: move all AddressSource and non-coordinate AddressHeuristic
 * records from the loser to the winner, soft-delete coordinate heuristics on the
 * loser (the winner's coordinates are re-derived from its own meta), then soft-delete the loser.
 *
 * @param {Object} context - Keystone context
 * @param {string} winnerId - The address that survives
 * @param {string} loserId - The address that will be soft-deleted
 * @param {Object} dvSender - { dv, sender } for audit
 * @returns {Promise<void>}
 */
async function mergeAddresses (context, winnerId, loserId, dvSender) {
    // Safety check: refuse to merge if other addresses point to the loser.
    // After soft-deleting the loser, those rows would keep a dangling possibleDuplicateOf
    // reference to a deleted address, causing incorrect follow-up merges.
    const dependents = await find('Address', {
        possibleDuplicateOf: { id: loserId },
        id_not: winnerId,
        deletedAt: null,
    })
    if (dependents.length > 0) {
        const ids = dependents.map((a) => a.id).join(', ')
        throw new Error(
            `Cannot merge: ${dependents.length} address(es) have possibleDuplicateOf → loser ${loserId}: [${ids}]. ` +
            'Resolve or dismiss those duplicates first.'
        )
    }

    // Move AddressSource records from loser → winner
    const loserSources = await find('AddressSource', { address: { id: loserId }, deletedAt: null })
    for (const source of loserSources) {
        await AddressSource.update(context, source.id, {
            ...dvSender,
            address: { connect: { id: winnerId } },
        })
    }

    // Move AddressHeuristic records from loser → winner.
    // Coordinate heuristics are handled separately: instead of blindly moving the loser's
    // coordinates, we ensure the winner ends up with coordinates derived from its own
    // provider data (applying the same quality rules used at ingestion time).
    const loserHeuristics = await find('AddressHeuristic', { address: { id: loserId }, deletedAt: null })
    const winner = await getById('Address', winnerId)

    for (const heuristic of loserHeuristics) {
        if (heuristic.type === HEURISTIC_TYPE_COORDINATES) {
            // Always soft-delete the loser's coordinate heuristic — the winner gets
            // a fresh one extracted from its own meta (see below), or already has one.
            await AddressHeuristic.update(context, heuristic.id, {
                ...dvSender,
                deletedAt: new Date().toISOString(),
            })
            continue
        }

        await AddressHeuristic.update(context, heuristic.id, {
            ...dvSender,
            address: { connect: { id: winnerId } },
        })
    }

    // Ensure winner has a coordinate heuristic.
    // ensureCoordinateHeuristic is a no-op if one already exists.
    await ensureCoordinateHeuristic(context, winner, dvSender)

    // Soft-delete the loser
    await Address.update(context, loserId, {
        ...dvSender,
        deletedAt: new Date().toISOString(),
        possibleDuplicateOf: { disconnectAll: true },
    })

    // Clear possibleDuplicateOf on the winner (if set)
    if (winner && winner.possibleDuplicateOf) {
        await Address.update(context, winnerId, {
            ...dvSender,
            possibleDuplicateOf: { disconnectAll: true },
        })
    }

    const movedHeuristics = loserHeuristics.filter((h) => h.type !== HEURISTIC_TYPE_COORDINATES).length
    logger.info({ msg: 'Merged addresses', data: { winnerId, loserId, movedSources: loserSources, movedHeuristics } })
}

module.exports = {
    mergeAddresses,
}
