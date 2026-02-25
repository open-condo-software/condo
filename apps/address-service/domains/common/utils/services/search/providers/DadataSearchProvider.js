const get = require('lodash/get')

const {
    HEURISTIC_TYPE_FIAS_ID,
    HEURISTIC_TYPE_COORDINATES,
    HEURISTIC_TYPE_FALLBACK,
} = require('@address-service/domains/common/constants/heuristicTypes')
const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers')

const { AbstractSearchProvider } = require('./AbstractSearchProvider')

function hasExactGeoQuality (normalizedBuilding) {
    return String(get(normalizedBuilding, ['data', 'qc_geo'])) === '0'
}

/**
 * The dadata search provider
 * Temporary use the suggestions API @link https://dadata.ru/api/suggest/address/
 * instead of the standardization API which is paid @link https://dadata.ru/api/clean/address/
 */
class DadataSearchProvider extends AbstractSearchProvider {

    /**
     * @param {ProviderDetectorArgs} args
     */
    constructor (args) {
        super(args)
        // Use the suggestions API instead of the standardization API. At least yet.
        this.suggestionProvider = new DadataSuggestionProvider({ req: this.req })
    }

    getProviderName () {
        return DADATA_PROVIDER
    }

    /**
     * @returns {Promise<DadataObject[]>}
     */
    async get ({ query, context = '', helpers = {} }) {
        return await this.suggestionProvider.get({ query, context, count: 1, helpers })
    }

    /**
     * @param {DadataObject[]} data
     * @returns {NormalizedBuilding[]}
     */
    normalize (data) {
        return this.suggestionProvider.normalize(data)
    }

    /**
     * @param {string} fiasId
     * @returns {Promise<DadataObject|null>}
     */
    async getAddressByFiasId (fiasId) {
        return await this.suggestionProvider.getAddressByFiasId(fiasId)
    }

    /**
     * Extract all possible heuristic identifiers from normalized data.
     * Dadata provides: fias_id, coordinates, and fallback key.
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

        const geoLat = get(normalizedBuilding, ['data', 'geo_lat'])
        const geoLon = get(normalizedBuilding, ['data', 'geo_lon'])
        if (geoLat != null && geoLon != null && hasExactGeoQuality(normalizedBuilding)) {
            const qcGeo = get(normalizedBuilding, ['data', 'qc_geo'])
            heuristics.push({
                type: HEURISTIC_TYPE_COORDINATES,
                value: `${geoLat},${geoLon}`,
                reliability: 90,
                meta: qcGeo != null ? { qc_geo: qcGeo } : null,
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

module.exports = { DadataSearchProvider }
