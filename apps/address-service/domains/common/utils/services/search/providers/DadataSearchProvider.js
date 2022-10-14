const { AbstractSearchProvider } = require('@address-service/domains/common/utils/services/search/AbstractSearchProvider')
const get = require('lodash/get')
const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers')

/**
 * The dadata search provider
 * Temporary use the suggestions API @link https://dadata.ru/api/suggest/address/
 * instead of the standardization API @link https://dadata.ru/api/clean/address/
 */
class DadataSearchProvider extends AbstractSearchProvider {


    getProviderName () {
        return DADATA_PROVIDER
    }

    /**
     * @returns {Promise<DadataObject[]>}
     */
    async get ({ query, context = null }) {
        // Use the suggestions API instead of the standardization API. At least yet.
        const suggestionProvider = new DadataSuggestionProvider()
        return await suggestionProvider.get({ query, context, count: 1 })
    }

    /**
     * @param {DadataObject[]} data
     * @returns {NormalizedSuggestion[]}
     */
    normalize (data) {
        return data.map((item) => ({
            value: item.value,
            data: {
                country: get(item, ['data', 'country']),
                region: get(item, ['data', 'region_with_type']),
                area: get(item, ['data', 'area_with_type']),
                city: get(item, ['data', 'city_with_type']),
                settlement: get(item, ['data', 'settlement_with_type']),
                street: get(item, ['data', 'street_with_type']),
                building: String(`${get(item, ['data', 'house_type_full']) || ''} ${get(item, ['data', 'house']) || ''}`).trim(),
                block: String(`${get(item, ['data', 'block_type_full']) || ''} ${get(item, ['data', 'block']) || ''}`).trim(),
            },
        }))
    }
}

module.exports = { DadataSearchProvider }
