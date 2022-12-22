const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const get = require('lodash/get')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')
const { GoogleSearchProvider } = require('../providers')

const SEPARATOR = ':'

class SearchByProvider extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @param {SearchPluginParams} params
     * @returns {boolean}
     */
    isEnabled (s, params) {
        const [type, placeId] = s.split(SEPARATOR, 2)

        return type === 'googlePlaceId' && !!placeId
    }

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        const [, placeId] = s.split(SEPARATOR, 2)
        const googleProvider = new GoogleSearchProvider()
        const godContext = this.keystoneContext.sudo()
        const dvSender = {
            dv: 1,
            sender: { dv: 1, fingerprint: `address-service-search-${this.constructor.name}` },
        }

        const denormalizedResult = await googleProvider.getByPlaceId(placeId)
        const [searchResult] = googleProvider.normalize([denormalizedResult])

        if (!searchResult) {
            return null
        }

        const addressKey = generateAddressKey(searchResult)

        return await createOrUpdateAddressWithSource(
            godContext,
            {
                address: searchResult.value,
                key: addressKey,
                meta: {
                    provider: {
                        name: googleProvider.getProviderName(),
                        rawData: denormalizedResult,
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
