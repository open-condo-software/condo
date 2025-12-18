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

const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')

const { searchContexts } = require('@address-service/domains/common/constants/contexts')

const JOINER = '~'
const SPACE_REPLACER = '_'
const SPECIAL_SYMBOLS_TO_REMOVE_REGEX = /[!@#$%^&*)(+=.,_:;"'`[\]{}№|<>~]/g

/**
 * @abstract
 */
class AbstractSearchProvider {

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
     * @param {?string} [context] {@see searchContexts}
     * @param {SuggestionHelpersType} [helpers]
     * @returns {Promise<Array>} the array of denormalized suggestions
     * @abstract
     * @public
     */
    async get ({ query, context = null, helpers = {} }) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Normalizes data got from external service
     * @param data
     * @returns {NormalizedBuilding[]}
     * @abstract
     * @public
     */
    normalize (data) {
        throw new Error('Method still not implemented.')
    }

    /**
     * @param {string} fiasId
     * @returns {Promise<DadataObject|null>}
     */
    async getAddressByFiasId (fiasId) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Generates a unique address key from normalized building data.
     * This is the fallback implementation that builds key from address parts.
     * If provider has some unique identifier (like house_fias_id), it should override this method.
     * @param {import('@address-service/domains/common/utils/services/index.js').NormalizedBuilding} normalizedBuilding
     * @returns {string}
     * @public
     */
    generateAddressKey (normalizedBuilding) {
        const data = normalizedBuilding.data

        /**
         * @type {string[]}
         */
        const parts = [
            get(data, 'country'),
            get(data, 'region'),
            get(data, 'area'),
            get(data, 'city'),
            get(data, 'city_district'),
            get(data, 'settlement'),
            get(data, 'street_type_full'),
            get(data, 'street'),
            get(data, 'house'),
            get(data, 'block_type_full'),
            get(data, 'block'),
        ]

        return parts
            // Remove empty parts
            .filter(Boolean)
            // Keep single space between words
            .map(
                (part) => (
                    String(part)
                        .replace(SPECIAL_SYMBOLS_TO_REMOVE_REGEX, '')
                        .split(/\s/)
                        .filter((word) => Boolean(word.trim()))
                        .join(' ')
                        .replace(/\s/g, SPACE_REPLACER)
                ),
            )
            // Remove newly appeared empty parts
            .filter(Boolean)
            .join(JOINER)
            .toLowerCase()
    }
}

module.exports = { AbstractSearchProvider }
