const { getByCondition } = require('@open-condo/keystone/schema')

const { Address } = require('@address-service/domains/address/utils/serverSchema')
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
        // It's possible to make this plugin always enabled, because it is not used aby providers.
        // Only local database is used.
        return true
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
