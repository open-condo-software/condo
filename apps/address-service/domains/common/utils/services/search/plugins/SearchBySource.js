const { getByCondition } = require('@open-condo/keystone/schema')

const { Address } = require('@address-service/domains/address/utils/serverSchema')
const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { getSearchProvider } = require('@address-service/domains/common/utils/services/providerDetectors')
const { mergeAddressAndHelpers } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')

class SearchBySource extends AbstractSearchPlugin {

    /**
     * @inheritDoc
     * @param {String} s
     * @param {SearchPluginParams} params
     * @returns {boolean}
     */
    isEnabled (s, params) {
        const provider = getSearchProvider({ req: params.req })

        // TODO (DOMA-11991): Maybe create some settings for providers, because it's possible has no sources for Pullenti (this is local database)
        return !!provider && provider.getProviderName() !== PULLENTI_PROVIDER
    }

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        // We want to return the same result for the same source. This is the address cache, baby!
        const godContext = this.keystoneContext.sudo()

        const addressSource = await getByCondition('AddressSource', {
            deletedAt: null,
            source: mergeAddressAndHelpers(s, this.helpers).toLowerCase(),
        })

        if (!addressSource) {
            return null
        }

        const addressFoundBySource = await Address.getOne(
            godContext,
            { id: addressSource.address, deletedAt: null },
            'id address key meta overrides'
        )

        return addressFoundBySource ? addressFoundBySource : null
    }
}

module.exports = { SearchBySource }
