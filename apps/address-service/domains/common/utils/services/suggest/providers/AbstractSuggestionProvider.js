const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')

const { suggestionContexts } = require('@address-service/domains/common/constants/contexts')

/**
 * @abstract
 */
class AbstractSuggestionProvider {

    /**
     * @param {ProviderDetectorArgs} args
     */
    constructor (args) {
        this.logger = getLogger(this.constructor.name)
        this.req = get(args, 'req')
    }

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
     * @param {string} context
     * @returns {Object}
     * @protected
     */
    getContext (context = '') {
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
     * @typedef {Object} SuggestionHelpersType
     * @property {string} tin The organization's tin (inn)
     */

    /**
     * Sends search string to external suggestions service
     * @param {string} query
     * @param {string} session
     * @param {string} [context] {@see suggestionContexts}
     * @param {string} language
     * @param {number|NaN} count
     * @param {SuggestionHelpersType} [helpers]
     * @returns {Promise<Array>} the array of denormalized suggestions
     * @abstract
     * @public
     */
    async get ({ query, session = '', context = '', language = '', count = NaN, helpers = {} }) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Normalizes data got from external service
     * @param {Array} data
     * @returns {Object[]}
     * @abstract
     * @public
     */
    normalize (data) {
        throw new Error('Method still not implemented.')
    }
}

module.exports = { AbstractSuggestionProvider }
