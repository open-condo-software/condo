const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers')

const { AbstractSearchProvider } = require('./AbstractSearchProvider')

/**
 * The dadata search provider
 * Temporary use the suggestions API @link https://dadata.ru/api/suggest/address/
 * instead of the standardization API which is paid @link https://dadata.ru/api/clean/address/
 */
class DadataSearchProvider extends AbstractSearchProvider {

    constructor () {
        super()
        // Use the suggestions API instead of the standardization API. At least yet.
        this.suggestionProvider = new DadataSuggestionProvider()
    }

    getProviderName () {
        return DADATA_PROVIDER
    }

    /**
     * @returns {Promise<DadataObject[]>}
     */
    async get ({ query, context = null }) {
        return await this.suggestionProvider.get({ query, context, count: 1 })
    }

    /**
     * @param {DadataObject[]} data
     * @returns {NormalizedBuilding[]}
     */
    normalize (data) {
        return this.suggestionProvider.normalize(data)
    }
}

module.exports = { DadataSearchProvider }
