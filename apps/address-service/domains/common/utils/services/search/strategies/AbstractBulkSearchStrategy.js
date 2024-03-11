const { get, isArray, isEmpty, set } = require('lodash')

const { OVERRIDING_ROOT } = require('@address-service/domains/address/constants')
const { createReturnObject } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')

class AbstractBulkSearchStrategy {
    /**
     * @param keystone The Keystonejs instance
     * @param {AbstractSearchPlugin[]} plugins The array of search plugins
     */
    constructor (keystone, plugins) {
        this.plugins = plugins
        this.keystoneContext = keystone.createContext()
    }

    /**
     * @param req
     * @return {{[helpers]: SuggestionHelpersType, [extractUnit]: boolean, [searchContext]: string, items: String[]}}
     */
    getReqParams (req) {
        /** @type {String[]} */
        const items = get(req, ['body', 'items'])

        if (!items && isArray(items) && !isEmpty(items)) {
            throw new Error('Not found items to search for')
        }

        const searchContext = String(get(req, ['body', 'context'], ''))

        /**
         * Additional parameters for improving of the searching
         * @type {Object}
         */
        const helpers = get(req, ['body', 'helpers'], {})

        /**
         * In the case the address string contains unit data, we may try to extract unitType and unitName
         * @type {boolean}
         */
        const extractUnit = Boolean(get(req, ['body', 'extractUnit'], false))

        return {
            items,
            searchContext,
            helpers,
            extractUnit,
        }
    }

    /**
     * @param {IncomingMessage} req The Express request object
     * @return {Promise<{ addresses: Object<addressKey: string, address: AddressData>, map: Object<item: string, addressKey: string> }>}
     */
    search (req) {
        throw new Error('Method not implemented yet')
    }

    async processPluginResult (searchResult) {
        // Override the values if overrides were set
        let overridden = {}
        Object.entries(get(searchResult, 'overrides', {}) || {}).forEach(([path, value]) => {
            // 1. Keep overridden value
            set(overridden, path, get(searchResult, `${OVERRIDING_ROOT}.${path}`))
            // 2. Do override
            set(searchResult, `${OVERRIDING_ROOT}.${path}`, value)
        })

        return await createReturnObject({
            context: this.keystoneContext.sudo(),
            addressModel: searchResult,
            overridden,
        })
    }

    /**
     * @param {{ addresses: object, map: object }} result Mutable result variable
     * @param {{ item: string, searchedAddress: { err?: string|null, data: any } }[]} searchedAddressesData
     */
    injectAddressesDataToResult (result, searchedAddressesData) {
        for (const searchedAddressData of searchedAddressesData) {
            if (!searchedAddressData) {
                continue
            }
            const { item, searchedAddress } = searchedAddressData
            const err = get(searchedAddress, 'err')
            let data

            if (err) {
                data = get(searchedAddress, 'data', err)
            } else {
                const addressKey = get(searchedAddress, ['data', 'addressKey'])
                const { unitType, unitName, ...restAddressFields } = get(searchedAddress, 'data')
                result.addresses[addressKey] = restAddressFields
                data = { addressKey, unitType, unitName }
            }
            result.map[item] = { err, data }
        }
    }
}

module.exports = {
    AbstractBulkSearchStrategy,
}
