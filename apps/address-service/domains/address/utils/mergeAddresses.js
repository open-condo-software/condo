const { getLogger } = require('@open-condo/keystone/logging')
const { find, getById } = require('@open-condo/keystone/schema')

const { Address, AddressHeuristic, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { HEURISTIC_TYPE_COORDINATES } = require('@address-service/domains/common/constants/heuristicTypes')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const { parseCoordinates } = require('@address-service/domains/common/utils/services/search/heuristicMatcher')

const logger = getLogger('mergeAddresses')

/**
 * Merge two addresses: move all AddressSource and AddressHeuristic records
 * from the loser to the winner, then soft-delete the loser.
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
    // If it already has one, do nothing. Otherwise, extract from winner.meta using
    // provider-specific quality rules (e.g. qc_geo=0 for Dadata) and create it.
    const winnerCoordHeuristic = await find('AddressHeuristic', {
        address: { id: winnerId },
        type: HEURISTIC_TYPE_COORDINATES,
        deletedAt: null,
    })

    if (winnerCoordHeuristic.length === 0 && winner && winner.meta) {
        const providerName = winner.meta?.provider?.name
        const searchProvider = getSearchProvider({ provider: providerName })
        const extracted = searchProvider
            ? searchProvider.extractHeuristics(winner.meta).find((h) => h.type === HEURISTIC_TYPE_COORDINATES) ?? null
            : null
        if (extracted) {
            const coords = parseCoordinates(extracted.value)
            await AddressHeuristic.create(context, {
                ...dvSender,
                address: { connect: { id: winnerId } },
                type: HEURISTIC_TYPE_COORDINATES,
                value: extracted.value,
                reliability: extracted.reliability,
                provider: winner.meta?.provider?.name,
                meta: extracted.meta || null,
                enabled: true,
                ...(coords ? { latitude: String(coords.latitude), longitude: String(coords.longitude) } : {}),
            })
        }
    }

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

    logger.info({ msg: 'Merged addresses', data: { winnerId, loserId, movedSources: loserSources.length, movedHeuristics: loserHeuristics.length } })
}

module.exports = {
    mergeAddresses,
}
