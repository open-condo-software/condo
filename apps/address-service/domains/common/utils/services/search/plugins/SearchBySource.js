const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')
const { Address, AddressSource } = require('@address-service/domains/address/utils/serverSchema')

class SearchBySource extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        // We want to return the same result for the same source. This is the address cache, baby!
        const godContext = this.keystoneContext.sudo()

        const addressSource = await AddressSource.getOne(godContext, { source: s })
        if (!addressSource) {
            return null
        }

        const addressFoundBySource = await Address.getOne(godContext, { id: addressSource.address })

        return addressFoundBySource ? addressFoundBySource : null
    }
}

module.exports = { SearchBySource }
