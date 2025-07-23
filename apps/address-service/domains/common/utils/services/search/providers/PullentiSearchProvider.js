const get = require('lodash/get')

const { createInstance } = require('@open-condo/clients/pullenti-client')
const conf = require('@open-condo/config')

const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { normalize } = require('@address-service/domains/common/utils/services/utils/pullenti/normalizer')
const { maybeBoostQueryWithTin } = require('@address-service/domains/common/utils/services/utils/pullenti/queryBooster')

const { AbstractSearchProvider } = require('./AbstractSearchProvider')

const CONFIG_KEY = 'PULLENTI_CONFIG'

/**
 * The Pullenti search provider
 * Uses local server with own custom index
 * Suitable for RU addresses
 */
class PullentiSearchProvider extends AbstractSearchProvider {

    /**
     * @param {ProviderDetectorArgs} args
     */
    constructor (args) {
        super(args)

        const config = get(conf, CONFIG_KEY)
        if (!config) {
            throw new Error(`There is no '${CONFIG_KEY}' in .env.`)
        }

        const { url } = JSON.parse(config)

        if (!url) {
            throw new Error(`There is no 'url' field within the json-value of the '${CONFIG_KEY}' in .env.`)
        }

        this.url = url
        this.pullentiClient = createInstance()
    }

    getProviderName () {
        return PULLENTI_PROVIDER
    }

    /**
     * @returns {Promise<string|null>}
     */
    async get ({ query, context = '', helpers = {} }) {
        const { tin = null } = helpers

        if (tin) {
            query = await maybeBoostQueryWithTin(query, tin, this.req)
        }

        return await this.pullentiClient.processAddress(query)
    }

    /**
     * @param {string} xmlString XML string
     * @returns {NormalizedBuilding[]}
     */
    normalize (xmlString) {
        return [normalize(xmlString)]
    }
}

module.exports = { PullentiSearchProvider }
