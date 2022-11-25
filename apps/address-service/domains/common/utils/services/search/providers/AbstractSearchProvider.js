/**
 * @typedef {Object} NormalizedSearchData
 * @property {string} country "Russia"
 * @property {string?} region "Sverdlovsk region"
 * @property {string} city "Yekaterinburg"
 * @property {string?} street "Lenina"
 * @property {string} building "66", "66a"
 * @property {string?} unitType "room", "flat", "box"
 * @property {string?} unitName "428", "42/8"
 */

/**
 * @typedef {Object} NormalizedSearch
 * @property {string} value "Russia, Sverdlovsk region, Yekaterinburg, Lenina, 66"
 * @property {NormalizedSearchData} data
 */

const { searchContexts } = require('@address-service/domains/common/constants/contexts')
const get = require('lodash/get')

/**
 * @abstract
 */
class AbstractSearchProvider {

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
            ...get(searchContexts, ['default', this.getProviderName()], {}),
            ...get(searchContexts, [context, this.getProviderName()], {}),
        }
    }

    /**
     * Sends search string to external search service
     * @param {string} query
     * @param {?string} context {@see searchContexts}
     * @returns {Promise<Array>} the array of denormalized suggestions
     * @abstract
     * @public
     */
    async get ({ query, context = null }) {
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

module.exports = { AbstractSearchProvider }
