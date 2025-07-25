const get = require('lodash/get')

const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')

class SearchByProvider extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @param {SearchPluginParams} params
     * @returns {boolean}
     */
    isEnabled (s, params) {
        return !!getSearchProvider({ req: params.req })
    }

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        const searchProvider = getSearchProvider({ req: this.req })
        const godContext = this.keystoneContext.sudo()
        const dvSender = this.getDvAndSender(this.constructor.name)

        const denormalizedResult = await searchProvider.get({
            query: s,
            context: this.searchContext,
            helpers: this.helpers,
        })
        const searchResults = searchProvider ? searchProvider.normalize(denormalizedResult) : []

        if (searchResults.length === 0) {
            return null
        }

        // Use the first result for a while
        const searchResult = searchResults[0]

        const addressKey = generateAddressKey(searchResult)

        if (!addressKey) {
            throw new Error('Impossible to build addressKey')
        }

        const addressData = {
            address: searchResult.value,
            key: addressKey,
            meta: {
                provider: {
                    name: searchProvider.getProviderName(),
                    rawData: denormalizedResult[0] || null,
                },
                value: searchResult.value,
                unrestricted_value: searchResult.unrestricted_value,
                data: get(searchResult, 'data', {}),
                helpers: this.helpers,
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
