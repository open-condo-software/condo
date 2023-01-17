const get = require('lodash/get')

const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')
const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')

const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')

class SearchByProvider extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        const searchProvider = getSearchProvider(this.geo)
        const godContext = this.keystoneContext.sudo()
        const dvSender = this.getDvAndSender(this.constructor.name)

        const denormalizedRows = await searchProvider.get({ query: s, context: this.searchContext })
        const searchResults = searchProvider.normalize(denormalizedRows)

        if (searchResults.length === 0) {
            return null
        }

        // Use the first result for a while
        const searchResult = searchResults[0]

        const addressKey = generateAddressKey(searchResult)

        const addressData = {
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
        }

        return await createOrUpdateAddressWithSource(
            godContext,
            Address,
            AddressSource,
            addressData,
            s,
            dvSender,
        )
    }
}

module.exports = { SearchByProvider }
