const { AbstractSearchPlugin } = require('@address-service/domains/common/utils/services/search/AbstractSearchPlugin')
const { Address } = require('@address-service/domains/address/utils/serverSchema')

class SearchBySource extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        // We want to return the same result for the same source. This is the address cache, baby!
        const addressFoundBySource = await Address.getOne(this.keystoneContext.sudo(), { sources_some: { source: s } })

        return addressFoundBySource ? addressFoundBySource : null
    }
}

module.exports = { SearchBySource }
