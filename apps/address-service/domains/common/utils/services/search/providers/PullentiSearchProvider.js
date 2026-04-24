const get = require('lodash/get')

const { createInstance } = require('@open-condo/clients/pullenti-client')
const conf = require('@open-condo/config')

const { HEURISTIC_TYPE_FIAS_ID, HEURISTIC_TYPE_FALLBACK } = require('@address-service/domains/common/constants/heuristicTypes')
const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { getXmlParser, normalize } = require('@address-service/domains/common/utils/services/utils/pullenti/normalizer')
const { maybeBoostQueryWithTin } = require('@address-service/domains/common/utils/services/utils/pullenti/queryBooster')

const { AbstractSearchProvider } = require('./AbstractSearchProvider')


/**
 * TODO (DOMA-11991)
 * ⚠️ Pullenti provider still in beta. Normalized result may differ from dadata. Use only for GUID searching.
 */

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
        this.xmlParser = getXmlParser()
    }

    getProviderName () {
        return PULLENTI_PROVIDER
    }

    /**
     * @returns {Promise<string[]>}
     */
    async get ({ query, context = '', helpers = {} }) {
        const { tin = null } = helpers

        if (tin) {
            query = await maybeBoostQueryWithTin(query, tin, this.req)
        }

        // processAddress returns a string, not an array
        return [await this.pullentiClient.processAddress(query)]
    }

    /**
     * @param {string[]} xmlStrings XML strings
     * @returns {NormalizedBuilding[]}
     */
    normalize (xmlStrings) {
        return xmlStrings.map(normalize)
    }

    /**
     * @param {string} fiasId
     * @returns {Promise<string|null>}
     */
    async getAddressByFiasId (fiasId) {
        const xmlResult = await this.pullentiClient.searchByGuid(fiasId) || null
        const jsonResult = this.xmlParser.parse(xmlResult)
        if (!jsonResult?.searchresult?.gar) {
            return null
        }

        const gar = jsonResult?.searchresult?.gar || null

        return gar && gar.path ? this.pullentiClient.processAddress(gar.path) : null
    }

    /**
     * Extract all possible heuristic identifiers from normalized data.
     * Pullenti provides: fias_id and fallback key.
     * @param {import('@address-service/domains/common/utils/services/index.js').NormalizedBuilding} normalizedBuilding
     * @returns {Array<{type: string, value: string, reliability: number, meta?: object}>}
     */
    extractHeuristics (normalizedBuilding) {
        const heuristics = []

        const houseFiasId = get(normalizedBuilding, ['data', 'house_fias_id'])
        if (houseFiasId) {
            heuristics.push({
                type: HEURISTIC_TYPE_FIAS_ID,
                value: houseFiasId,
                reliability: 95,
                meta: null,
            })
        }

        const fallbackKey = this.generateFallbackKey(normalizedBuilding)
        if (fallbackKey) {
            heuristics.push({
                type: HEURISTIC_TYPE_FALLBACK,
                value: fallbackKey,
                reliability: 10,
                meta: null,
            })
        }

        return heuristics
    }
}

module.exports = { PullentiSearchProvider }
