const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const get = require('lodash/get')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

class SearchByProvider extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        const searchProvider = getSearchProvider(this.geo)
        const godContext = this.keystoneContext.sudo()
        const dvSender = {
            dv: 1,
            sender: { dv: 1, fingerprint: `address-service-search-${this.constructor.name}` },
        }

        const denormalizedRows = await searchProvider.get({ query: s, context: this.searchContext })
        const searchResults = searchProvider.normalize(denormalizedRows)

        if (searchResults.length === 0) {
            return null
        }

        // Use the first result for a while
        const searchResult = searchResults[0]

        const addressKey = generateAddressKey(searchResult)

        return await createOrUpdateAddressWithSource(
            godContext,
            {
                address: searchResult.value,
                key: addressKey,
                meta: {
                    provider: {
                        name: searchProvider.getProviderName(),
                        rawData: denormalizedRows[0],
                    },
                    value: searchResult.value,
                    unrestricted_value: searchResult.unrestricted_value,
                    data: get(searchResult, 'data', {}),
                },
            },
            s,
            dvSender,
        )
    }
}

module.exports = { SearchByProvider }
