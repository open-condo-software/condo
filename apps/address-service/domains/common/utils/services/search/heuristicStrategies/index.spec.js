const { HEURISTIC_TYPE_COORDINATES } = require('@address-service/domains/common/constants/heuristicTypes')
const {
    getHeuristicStrategy,
    AbstractHeuristicStrategy,
    CoordinateHeuristicStrategy,
    ExactHeuristicStrategy,
    COORDINATE_TOLERANCE,
    parseCoordinates,
} = require('@address-service/domains/common/utils/services/search/heuristicStrategies')

describe('heuristicStrategies/index', () => {

    describe('getHeuristicStrategy', () => {
        it('returns CoordinateHeuristicStrategy for coordinates type', () => {
            expect(getHeuristicStrategy(HEURISTIC_TYPE_COORDINATES)).toBeInstanceOf(CoordinateHeuristicStrategy)
        })

        it('returns ExactHeuristicStrategy for any other type', () => {
            expect(getHeuristicStrategy('fias_id')).toBeInstanceOf(ExactHeuristicStrategy)
            expect(getHeuristicStrategy('fallback')).toBeInstanceOf(ExactHeuristicStrategy)
            expect(getHeuristicStrategy('google_place_id')).toBeInstanceOf(ExactHeuristicStrategy)
        })

        it('returned ExactHeuristicStrategy has correct type', () => {
            expect(getHeuristicStrategy('fias_id').type).toBe('fias_id')
        })

        it('all returned strategies extend AbstractHeuristicStrategy', () => {
            expect(getHeuristicStrategy(HEURISTIC_TYPE_COORDINATES)).toBeInstanceOf(AbstractHeuristicStrategy)
            expect(getHeuristicStrategy('fias_id')).toBeInstanceOf(AbstractHeuristicStrategy)
        })
    })

    describe('re-exports', () => {
        it('exports COORDINATE_TOLERANCE', () => {
            expect(COORDINATE_TOLERANCE).toBe(0.00001)
        })

        it('exports parseCoordinates', () => {
            expect(parseCoordinates('55.0,37.0')).toEqual({ latitude: 55.0, longitude: 37.0 })
        })
    })
})
