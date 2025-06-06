const get = require('lodash/get')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')

const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { normalize } = require('@address-service/domains/common/utils/services/utils/pullenti/normalizer')

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
    }

    getProviderName () {
        return PULLENTI_PROVIDER
    }

    /**
     * @returns {Promise<string|null>}
     */
    async get ({ query, context = '', helpers = {} }) {
        const response = await fetch(`${this.url}`, {
            method: 'POST',
            body: `<ProcessSingleAddressText>${query}</ProcessSingleAddressText>`,
        })

        if (response.ok) {
            return await response.text()
        }

        return null
    }

    /**
     * @param {string} xmlString XML string
     * @returns {NormalizedBuilding[]}
     */
    normalize (xmlString) {
        return normalize(xmlString)
    }
}

module.exports = { PullentiSearchProvider }
