const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')
const { mergeAddressAndHelpers } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')

class SearchBySource extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        // We want to return the same result for the same source. This is the address cache, baby!
        const godContext = this.keystoneContext.sudo()

        const addressSource = await AddressSource.getOne(godContext, {
            source_i: mergeAddressAndHelpers(s, this.helpers),
            deletedAt: null,
        })
        if (!addressSource) {
            return null
        }

        const addressFoundBySource = await Address.getOne(godContext, { id: addressSource.address.id, deletedAt: null })

        return addressFoundBySource ? addressFoundBySource : null
    }
}

module.exports = { SearchBySource }
