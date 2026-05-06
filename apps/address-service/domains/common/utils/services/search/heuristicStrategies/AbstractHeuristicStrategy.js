/**
 * Abstract base class defining the interface for a heuristic type strategy.
 * Each subclass encapsulates type-specific conflict detection and record creation logic.
 */
class AbstractHeuristicStrategy {
    constructor (type) {
        if (!type) throw new Error('type is required')
        this._type = type
    }

    /** @returns {string} */
    get type () {
        return this._type
    }

    /**
     * Find existing AddressHeuristic records that conflict with the given value.
     * @param {string} value
     * @returns {Promise<Array>}
     */
    // eslint-disable-next-line no-unused-vars
    async findConflicts (value) {
        throw new Error('findConflicts must be implemented')
    }

    /**
     * Return extra DB fields to include when creating an AddressHeuristic record.
     * @param {string} value
     * @returns {Object}
     */
    // eslint-disable-next-line no-unused-vars
    buildExtraFields (value) {
        return {}
    }

    /**
     * Determine whether a conflict for this heuristic should be vetoed based on
     * other incoming heuristics and the existing address's heuristics.
     * Default: never veto (only coordinate heuristics may be vetoed).
     *
     * @param {string} existingAddressId
     * @param {{type: string, value: string, reliability: number}} thisHeuristic
     * @param {Array<{type: string, value: string, reliability: number}>} allIncoming
     * @returns {Promise<boolean>}
     */
    // eslint-disable-next-line no-unused-vars
    async isConflictVetoed (existingAddressId, thisHeuristic, allIncoming) {
        return false
    }
}

module.exports = {
    AbstractHeuristicStrategy,
}
