const HEURISTIC_TYPE_FIAS_ID = 'fias_id'
const HEURISTIC_TYPE_COORDINATES = 'coordinates'
const HEURISTIC_TYPE_GOOGLE_PLACE_ID = 'google_place_id'
const HEURISTIC_TYPE_FALLBACK = 'fallback'

/**
 * All supported heuristic types.
 * Adding a new type requires updating this list.
 */
const HEURISTIC_TYPES = [
    HEURISTIC_TYPE_FIAS_ID,
    HEURISTIC_TYPE_COORDINATES,
    HEURISTIC_TYPE_GOOGLE_PLACE_ID,
    HEURISTIC_TYPE_FALLBACK,
]

module.exports = {
    HEURISTIC_TYPE_FIAS_ID,
    HEURISTIC_TYPE_COORDINATES,
    HEURISTIC_TYPE_GOOGLE_PLACE_ID,
    HEURISTIC_TYPE_FALLBACK,
    HEURISTIC_TYPES,
}
