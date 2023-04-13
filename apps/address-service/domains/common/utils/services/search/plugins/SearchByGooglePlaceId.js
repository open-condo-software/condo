const get = require('lodash/get')

const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { GOOGLE_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const { GoogleSearchProvider } = require('@address-service/domains/common/utils/services/search/providers')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')

const SEPARATOR = ':'

class SearchByGooglePlaceId extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @param {SearchPluginParams} params
     * @returns {boolean}
     */
    isEnabled (s, params) {
        const [type, placeId] = s.split(SEPARATOR, 2)
        const provider = getSearchProvider({ req: params.req })

        return type === 'googlePlaceId' && !!placeId && !!provider && provider.getProviderName() === GOOGLE_PROVIDER
    }

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        const [, placeId] = s.split(SEPARATOR, 2)
        const googleProvider = new GoogleSearchProvider()
        const godContext = this.keystoneContext.sudo()
        const dvSender = this.getDvAndSender(this.constructor.name)

        const denormalizedResult = await googleProvider.getByPlaceId(placeId)
        const [searchResult] = googleProvider.normalize([denormalizedResult])

        if (!searchResult) {
            return null
        }

        const addressKey = generateAddressKey(searchResult)

        const addressData = {
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

module.exports = { SearchByGooglePlaceId }
