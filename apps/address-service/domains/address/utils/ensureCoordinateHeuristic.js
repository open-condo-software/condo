const { AddressHeuristic } = require('@address-service/domains/address/utils/serverSchema')
const { HEURISTIC_TYPE_COORDINATES } = require('@address-service/domains/common/constants/heuristicTypes')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const { CoordinateHeuristicStrategy } = require('@address-service/domains/common/utils/services/search/heuristicStrategies')

/**
 * Ensure the given address has an active coordinate heuristic.
 * If one already exists, this is a no-op.
 * If not, attempt to extract coordinates from address.meta using the
 * provider-specific extractHeuristics() (applying ingestion-time quality rules).
 *
 * @param {Object} context - Keystone context
 * @param {Object} address - Address record (must include id and meta)
 * @param {Object} dvSender - { dv, sender } for audit
 * @returns {Promise<void>}
 */
async function ensureCoordinateHeuristic (context, address, dvSender) {
    const existing = await AddressHeuristic.getAll(context, {
        address: { id: address.id },
        type: HEURISTIC_TYPE_COORDINATES,
        deletedAt: null,
    })

    if (existing.length > 0 || !address.meta) {
        return
    }

    const providerName = address.meta?.provider?.name
    const searchProvider = getSearchProvider({ provider: providerName })
    const extracted = searchProvider
        ? searchProvider.extractHeuristics(address.meta).find((h) => h.type === HEURISTIC_TYPE_COORDINATES) ?? null
        : null

    if (!extracted) {
        return
    }

    const conflicts = await new CoordinateHeuristicStrategy().findConflicts(extracted.value)
    if (conflicts.length > 0) {
        return
    }

    await AddressHeuristic.create(context, {
        ...dvSender,
        address: { connect: { id: address.id } },
        type: HEURISTIC_TYPE_COORDINATES,
        value: extracted.value,
        reliability: extracted.reliability,
        provider: providerName || null,
        meta: extracted.meta || null,
        enabled: true,
        ...new CoordinateHeuristicStrategy().buildExtraFields(extracted.value),
    })
}

module.exports = {
    ensureCoordinateHeuristic,
}
