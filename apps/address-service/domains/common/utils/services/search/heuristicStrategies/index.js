const { HEURISTIC_TYPE_COORDINATES } = require('@address-service/domains/common/constants/heuristicTypes')
const { AbstractHeuristicStrategy } = require('@address-service/domains/common/utils/services/search/heuristicStrategies/AbstractHeuristicStrategy')
const { COORDINATE_TOLERANCE, parseCoordinates, CoordinateHeuristicStrategy } = require('@address-service/domains/common/utils/services/search/heuristicStrategies/CoordinateHeuristicStrategy')
const { ExactHeuristicStrategy } = require('@address-service/domains/common/utils/services/search/heuristicStrategies/ExactHeuristicStrategy')

/**
 * Return the strategy instance for the given heuristic type.
 * Falls back to ExactHeuristicStrategy for any unknown type.
 * @param {string} type
 * @returns {AbstractHeuristicStrategy}
 */
function getHeuristicStrategy (type) {
    if (type === HEURISTIC_TYPE_COORDINATES) return new CoordinateHeuristicStrategy()
    return new ExactHeuristicStrategy(type)
}

module.exports = {
    COORDINATE_TOLERANCE,
    parseCoordinates,
    AbstractHeuristicStrategy,
    ExactHeuristicStrategy,
    CoordinateHeuristicStrategy,
    getHeuristicStrategy,
}
