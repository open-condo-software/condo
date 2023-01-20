const get = require('lodash/get')

const { generateAddressKey } = require('@address-service/domains/common/utils/addressKeyUtils')
const { createOrUpdateAddressWithSource } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')
const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers')

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

        return type === 'fiasId' && !!fiasId
    }

    /**
     * @inheritDoc
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        const [, fiasId] = s.split(SEPARATOR, 2)
        const suggestionProvider = new DadataSuggestionProvider()
        const godContext = this.keystoneContext.sudo()
        const dvSender = this.getDvAndSender(this.constructor.name)

        const denormalizedResult = await suggestionProvider.getAddressByFiasId(fiasId)
        const [searchResult] = suggestionProvider.normalize([denormalizedResult])

        if (!searchResult) {
            return null
        }

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
                    name: suggestionProvider.getProviderName(),
                    rawData: denormalizedResult,
                },
                value: searchResult.value,
                unrestricted_value: searchResult.unrestricted_value,
                data: get(searchResult, 'data', {}),
            },
        }

        return await createOrUpdateAddressWithSource(godContext, addressData, s, dvSender)
    }
}

module.exports = { SearchByFiasId }
