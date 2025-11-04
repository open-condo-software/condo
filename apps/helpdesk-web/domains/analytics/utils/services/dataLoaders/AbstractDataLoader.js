const NOT_IMPLEMENTED_ERROR = 'Method not implemented'

/**
 * @abstract
 */
class AbstractDataLoader {
    constructor (props) {
        this.context = props.context

        if (this.get === 'undefined') {
            throw new Error(`You need to implement ${this.get.name}`)
        }
    }

    /**
     * Loads data with a provided loader
     * @param where {Object} filter options
     * @param groupBy {Array} groupBy GQL array string
     * @return {Promise<*>}
     */
    async get ({ where, groupBy }) {
        throw new Error(NOT_IMPLEMENTED_ERROR)
    }
}

module.exports = { AbstractDataLoader }
