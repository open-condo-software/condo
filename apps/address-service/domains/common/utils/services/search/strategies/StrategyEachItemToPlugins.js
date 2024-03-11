const { chunk, get } = require('lodash')

const { AddressFromStringParser } = require('@open-condo/clients/address-service-client/utils')

const { AbstractBulkSearchStrategy } = require('./AbstractBulkSearchStrategy')
const { BULK_SEARCH_CHUNK_SIZE, SEARCH_ERROR_COMMON, SEARCH_ERROR_NO_PLUGINS, SEARCH_ERROR_NOT_FOUND } = require('./constants')

class StrategyEachItemToPlugins extends AbstractBulkSearchStrategy {

    /**
     * @private
     * @param {string} searchContext
     * @param {IncomingMessage} req
     * @param {string} s
     * @param {SuggestionHelpersType} helpers
     * @param {boolean} extractUnit
     * @returns {Promise<{[err]: string, [data]:AddressData & {[unitType]: string, [unitName]: string}}>}
     */
    async searchAddress ({ searchContext, req, s, helpers = {}, extractUnit = false })  {
        const addressParser = new AddressFromStringParser()

        // Extract unitType and unitName
        let searchString = s, unitType, unitName
        if (extractUnit) {
            const { address, unitType: ut, unitName: un } = addressParser.parse(s)
            searchString = address
            if (!!ut && !!un) {
                unitType = ut
                unitName = un
            }
        }

        const pluginParams = { searchContext, keystoneContext: this.keystoneContext, req, helpers }

        const plugins = this.plugins.filter((plugin) => plugin.isEnabled(searchString, pluginParams))
        if (plugins.length === 0) {
            return { err: SEARCH_ERROR_NO_PLUGINS }
        }

        let searchResult = null
        try {
            for (const plugin of plugins) {
                // Return the first not empty plugin's result
                // So, the plugins order is mandatory for performance
                if (searchResult) {
                    break
                }

                searchResult = await plugin.prepare(pluginParams).search(searchString)
            }
        } catch (e) {
            return { err: SEARCH_ERROR_COMMON, data: get(e, ['errors', 0, 'message'], get(e, 'message')) }
        }

        if (!searchResult) {
            // Nothing found
            return { err: SEARCH_ERROR_NOT_FOUND }
        }

        const addressData = await this.processPluginResult(searchResult)

        return {
            data: {
                ...addressData,
                unitType,
                unitName,
            },
        }
    }

    /**
     * @param req
     * @return {Promise<{ addresses: Object<addressKey: string, address: AddressData>, map: Object<item: string, addressKey: string> }>}
     */
    async search (req) {
        const { items, searchContext, helpers, extractUnit } = this.getReqParams(req)

        const chunkedItems = chunk(items, BULK_SEARCH_CHUNK_SIZE)

        let result = { addresses: {}, map: {} }

        for (const itemsChunk of chunkedItems) {
            const searchedAddressesData = await Promise.all(itemsChunk.map((item) => new Promise((resolve) => {
                this.searchAddress({
                    searchContext,
                    req,
                    s: item,
                    helpers,
                    extractUnit,
                })
                    .then((searchedAddress) => resolve({ item, searchedAddress }))
                    .catch((e) => resolve({
                        item,
                        searchedAddress: {
                            err: SEARCH_ERROR_COMMON,
                            data: get(e, ['errors', 0, 'message'], get(e, 'message')),
                        },
                    }))
            })))

            this.injectAddressesDataToResult(result, searchedAddressesData)
        }

        return result
    }
}

module.exports = { StrategyEachItemToPlugins }
