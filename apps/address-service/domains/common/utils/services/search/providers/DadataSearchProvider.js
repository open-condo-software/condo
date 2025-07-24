const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers')

const { AbstractSearchProvider } = require('./AbstractSearchProvider')

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
}

module.exports = { DadataSearchProvider }
