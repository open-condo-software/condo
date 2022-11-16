const { AbstractSearchPlugin } = require('@address-service/domains/common/utils/services/search/AbstractSearchPlugin')
const { Address } = require('@address-service/domains/address/utils/serverSchema')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { SearchProviderDetector } = require('@address-service/domains/common/utils/services/search/SearchProviderDetector')
const get = require('lodash/get')

class SearchByProvider extends AbstractSearchPlugin {

    /**
     * @param s
     * @returns {Promise<Object[]>}
     */
    async search (s) {
        const searchDetector = new SearchProviderDetector()
        const searchProvider = searchDetector.getProvider(this.geo)
        const godContext = this.keystoneContext.sudo()
        const dvSender = {
            dv: 1,
            sender: { dv: 1, fingerprint: `address-service-search-${this.constructor.name}` },
        }

        const denormalizedRows = await searchProvider.get({ query: s, context: this.searchContext })
        const searchResult = searchProvider.normalize(denormalizedRows)

        if (searchResult.length === 0) {
            return []
        }

        // Use the first result for a while
        const addressKey = generateAddressKey(searchResult[0])

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
                    address: searchResult[0].value,
                    key: addressKey,
                    meta: {
                        provider: {
                            name: searchProvider.getProviderName(),
                            rawData: denormalizedRows[0],
                        },
                        data: get(searchResult, [0, 'data'], {}),
                    },
                },
            )
        }

        return [addressItem]
    }
}

module.exports = { SearchByProvider }
