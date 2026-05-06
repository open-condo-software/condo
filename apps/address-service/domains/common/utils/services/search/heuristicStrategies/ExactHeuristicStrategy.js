const { find } = require('@open-condo/keystone/schema')

const { AbstractHeuristicStrategy } = require('@address-service/domains/common/utils/services/search/heuristicStrategies/AbstractHeuristicStrategy')

/**
 * Strategy for all exact-match heuristic types (fias_id, google_place_id, fallback, etc.).
 */
class ExactHeuristicStrategy extends AbstractHeuristicStrategy {
    async findConflicts (value) {
        return await find('AddressHeuristic', {
            type: this.type,
            value,
            deletedAt: null,
            enabled: true,
        })
    }
}

module.exports = {
    ExactHeuristicStrategy,
}
