const { Address } = require('@address-service/domains/address/utils/serverSchema')

const { AbstractSearchPlugin } = require('./AbstractSearchPlugin')

const SEPARATOR = ':'

class SearchByAddressKey extends AbstractSearchPlugin {

    /**
     * @param {String} s
     * @param {SearchPluginParams} params
     * @returns {boolean}
     */
    isEnabled (s, params) {
        const [type, addressKey] = s.split(SEPARATOR, 2)

        return type === 'key' && !!addressKey
    }

    /**
     * @param {String} s
     * @returns {Promise<?Object>}
     */
    async search (s) {
        const [, key] = s.split(SEPARATOR, 2)
        const addressByKey = await Address.getOne(this.keystoneContext.sudo(), { id: key, deletedAt: null })

        return addressByKey ? addressByKey : null
    }
}

module.exports = { SearchByAddressKey }
