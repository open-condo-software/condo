const { suggestionContexts } = require('@address-service/domains/common/constants/contexts')
const get = require('lodash/get')

/**
 * @abstract
 */
class AbstractSuggestionProvider {

    /**
     * @abstract
     * @public
     * @returns {string} The provider name (constant)
     */
    getProviderName () {
        throw new Error('Method still not implemented.')
    }

    /**
     * Returns the context object
     * @param {?string} context
     * @returns {Object}
     * @protected
     */
    getContext (context = null) {
        return {
            ...get(suggestionContexts, ['default', this.getProviderName()], {}),
            ...(
                context
                    ? get(suggestionContexts, [context, this.getProviderName()], {})
                    : {}
            ),
        }
    }

    /**
     * Sends search string to external suggestions service
     * @param {string} query
     * @param {?string} context {@see suggestionContexts}
     * @param {number|NaN} count
     * @returns {Promise<Array>} the array of denormalized suggestions
     * @abstract
     * @public
     */
    async get ({ query, context = null, count = NaN }) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Normalizes data got from external service
     * @param {Array} data
     * @returns {NormalizedBuilding[]}
     * @abstract
     * @public
     */
    normalize (data) {
        throw new Error('Method still not implemented.')
    }
}

module.exports = { AbstractSuggestionProvider }
