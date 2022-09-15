/**
 * @typedef {Object} NormalizedSuggestion
 * @property {string} country "Russia"
 * @property {?string} region "Sverdlovsk region"
 * @property {string} city "Yekaterinburg"
 * @property {?string} street "Lenina"
 * @property {string} building "66", "66a"
 * @property {?string} unitType "room", "flat", "box"
 * @property {?string} unitName "428", "42/8"
 */

const { suggestionContexts } = require('@address-service/domains/common/constants/contexts')
const get = require('lodash/get')

/**
 * @abstract
 */
class AbstractSuggestionProvider {

    /**
     * @abstract
     * @private
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
     * @returns {NormalizedSuggestion[]}
     * @abstract
     * @public
     */
    normalize (data) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Denormalizes data to external service's format
     * @param {NormalizedSuggestion[]} data
     * @returns {Array}
     * @abstract
     * @public
     */
    denormalize (data) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Returns suggestions that still do not exist in the results of the provider
     * @param {string} s
     * @returns {Array}
     * @public
     */
    getInjections (s) {
        return []
    }
}

module.exports = { AbstractSuggestionProvider }
