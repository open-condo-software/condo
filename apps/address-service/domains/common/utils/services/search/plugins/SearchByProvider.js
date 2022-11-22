const { AbstractSearchPlugin } = require('@address-service/domains/common/utils/services/search/AbstractSearchPlugin')
const { Address } = require('@address-service/domains/address/utils/serverSchema')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const get = require('lodash/get')

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

        const addressFoundByKey = await Address.getOne(godContext, { key: addressKey })

        let addressItem
        if (addressFoundByKey) {
            addressItem = addressFoundByKey
            if (!addressFoundByKey.sources.map(({ source }) => source).includes(s)) {
                addressItem = await Address.update(
                    godContext,
                    addressFoundByKey.id,
                    {
                        sources: { create: { source: s, ...dvSender } },
                        ...dvSender,
                    },
                )
            }
        } else {
            addressItem = await Address.create(
                godContext,
                {
                    ...dvSender,
                    sources: {
                        create: {
                            source: s,
                            ...dvSender,
                        },
                    },
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
            )
        }

        return addressItem
    }
}

module.exports = { SearchByProvider }
