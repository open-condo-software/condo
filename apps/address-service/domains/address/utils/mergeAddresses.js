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
    // Move AddressSource records from loser → winner
    const loserSources = await find('AddressSource', { address: { id: loserId }, deletedAt: null })
    for (const source of loserSources) {
        await AddressSource.update(context, source.id, {
            ...dvSender,
            address: { connect: { id: winnerId } },
        })
    }

    // Move AddressHeuristic records from loser → winner
    const loserHeuristics = await find('AddressHeuristic', { address: { id: loserId }, deletedAt: null })
    for (const heuristic of loserHeuristics) {
        const existing = await find('AddressHeuristic', {
            address: { id: winnerId },
            type: heuristic.type,
            value: heuristic.value,
            deletedAt: null,
        })

        if (existing.length > 0) {
            // Winner already has this heuristic — soft-delete the loser's copy
            await AddressHeuristic.update(context, heuristic.id, {
                ...dvSender,
                deletedAt: new Date().toISOString(),
            })
        } else {
            await AddressHeuristic.update(context, heuristic.id, {
                ...dvSender,
                address: { connect: { id: winnerId } },
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
    const winner = await getById('Address', winnerId)
    if (winner && winner.possibleDuplicateOf) {
        await Address.update(context, winnerId, {
            ...dvSender,
            possibleDuplicateOf: { disconnectAll: true },
        })
    }

    logger.info({ msg: 'Merged addresses', winnerId, loserId, movedSources: loserSources.length, movedHeuristics: loserHeuristics.length })
}

module.exports = {
    mergeAddresses,
}
