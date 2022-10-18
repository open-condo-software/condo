/**
 * @typedef {Object} NormalizedSuggestionData
 * @property {string} country "Russia"
 * @property {string?} region "Sverdlovsk region"
 * @property {string?} area "Невьянский"
 * @property {string} city "Yekaterinburg"
 * @property {string?} settlement "Шурала"
 * @property {string?} street "Lenina"
 * @property {string} building "66", "66a"
 * @property {string?} block "литера 23"
 * @property {string?} unitType "room", "flat", "box"
 * @property {string?} unitName "428", "42/8"
 */

/**
 * @typedef {Object} NormalizedSuggestion
 * @property {string} value "Russia, Sverdlovsk region, Yekaterinburg, Lenina, 66"
 * @property {NormalizedSuggestionData} data
 */

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
     * @returns {NormalizedSuggestion[]}
     * @abstract
     * @public
     */
    normalize (data) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Returns suggestions that still do not exist in the results of the provider
     * @param {string} s
     * @returns {Array}
     * @public
     */
    getInjections (s) {
        // todo(nas/*): write some logic to find eligible models
        return []
    }
}

module.exports = { AbstractSuggestionProvider }
