const get = require('lodash/get')
const { validate: isUUID } = require('uuid')

const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { DADATA_PROVIDER, PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')

const SEPARATOR = ':'

class SearchByFiasId extends AbstractSearchPlugin {

    /**
     * @inheritDoc
     * @param {String} s
     * @param {SearchPluginParams} params
     * @returns {boolean}
     */
    isEnabled (s, params) {
        const [type, fiasId] = s.split(SEPARATOR, 2)
        const provider = getSearchProvider({ req: params.req })

        return !!type && type === 'fiasId'
            && !!fiasId && isUUID(fiasId)
            && !!provider
            && [DADATA_PROVIDER, PULLENTI_PROVIDER].includes(provider?.getProviderName())
    }

    /**
     * @inheritDoc
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        const [, fiasId] = s.split(SEPARATOR, 2)
        const searchProvider = getSearchProvider({ req: this.req })
        const godContext = this.keystoneContext.sudo()
        const dvSender = this.getDvAndSender(this.constructor.name)

        const denormalizedResult = await searchProvider.getAddressByFiasId(fiasId)
        const searchResults = searchProvider ? searchProvider.normalize([denormalizedResult]) : []

        if (searchResults.length === 0) {
            return null
        }

        const searchResult = searchResults[0]

        if (get(searchResult, ['data', 'house_fias_id']) !== fiasId) {
            // For now, we want only houses
            return null
        }

        const addressKey = generateAddressKey(searchResult)

        const addressData = {
            address: searchResult.value,
            key: addressKey,
            meta: {
                provider: {
                    name: searchProvider.getProviderName(),
                    rawData: denormalizedResult || null,
                },
                value: searchResult.value,
                unrestricted_value: searchResult.unrestricted_value,
                data: get(searchResult, 'data', {}),
            },
        }

        return await createOrUpdateAddressWithSource(godContext, Address, AddressSource, addressData, s, dvSender)
    }
}

module.exports = { SearchByFiasId }
