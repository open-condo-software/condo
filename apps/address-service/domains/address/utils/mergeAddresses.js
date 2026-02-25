const { getLogger } = require('@open-condo/keystone/logging')
const { find, getById } = require('@open-condo/keystone/schema')

const { Address, AddressHeuristic, AddressSource } = require('@address-service/domains/address/utils/serverSchema')

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
    // The unique constraint on (type, value) WHERE deletedAt IS NULL guarantees
    // no other non-deleted row exists with the same pair, so reconnect is always safe.
    const loserHeuristics = await find('AddressHeuristic', { address: { id: loserId }, deletedAt: null })
    for (const heuristic of loserHeuristics) {
        await AddressHeuristic.update(context, heuristic.id, {
            ...dvSender,
            address: { connect: { id: winnerId } },
        })
    }

    // Soft-delete the loser
    await Address.update(context, loserId, {
        ...dvSender,
        deletedAt: new Date().toISOString(),
        possibleDuplicateOf: { disconnectAll: true },
    })

    // Clear possibleDuplicateOf on the winner (if set)
    const winner = await getById('Address', winnerId)
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
