const { chunk, get } = require('lodash')

const { AddressFromStringParser } = require('@open-condo/clients/address-service-client/utils')

const { AbstractBulkSearchStrategy } = require('./AbstractBulkSearchStrategy')
const { BULK_SEARCH_CHUNK_SIZE, SEARCH_ERROR_NOT_FOUND, SEARCH_ERROR_COMMON } = require('./constants')

/**
 * This search strategy pass all items to the first search plugin.
 * Then all strings without result goes to the 2nd plugin.
 * Then strings without result go to the 3rd plugin and so on.
 */
class StrategyAllItemsToEachPlugin extends AbstractBulkSearchStrategy {

    /**
     * @param req
     * @return {Promise<{ addresses: Object<addressKey: string, address: AddressData>, map: Object<item: string, addressKey: string> }>}
     */
    async search (req) {
        const { items, searchContext, helpers, extractUnit } = this.getReqParams(req)

        let result = { addresses: {}, map: {} }

        const pluginParams = { searchContext, keystoneContext: this.keystoneContext, req, helpers }

        let restItems = [...items]

        const addressParser = new AddressFromStringParser()

        for (const plugin of this.plugins) {
            const chunkedItems = chunk(restItems, BULK_SEARCH_CHUNK_SIZE)
            plugin.prepare(pluginParams)
            for (const itemsChunk of chunkedItems) {
                const itemsToSearchWithPlugin = itemsChunk.filter((item) => plugin.isEnabled(item, pluginParams))
                const searchedAddressesData = await Promise.all(itemsToSearchWithPlugin.map((item) => new Promise((resolve) => {
                    // Extract unitType and unitName
                    let searchString = item, unitType, unitName
                    if (extractUnit) {
                        const { address, unitType: ut, unitName: un } = addressParser.parse(item)
                        searchString = address
                        if (!!ut && !!un) {
                            unitType = ut
                            unitName = un
                        }
                    }

                    plugin.search(searchString).then(async (searchResult) => {
                        if (!searchResult) {
                            // Nothing found
                            resolve({ item, searchedAddress: { err: SEARCH_ERROR_NOT_FOUND } })
                        }

                        const addressData = await this.processPluginResult(searchResult)

                        resolve({
                            item,
                            searchedAddress: { data: { ...addressData, unitType, unitName } },
                        })
                    }).catch((e) => {
                        resolve({
                            item,
                            searchedAddress: {
                                err: SEARCH_ERROR_COMMON,
                                data: get(e, ['errors', 0, 'message'], get(e, 'message')),
                            },
                        })
                    })
                })))

                this.injectAddressesDataToResult(result, searchedAddressesData)
            }
            restItems = restItems.filter((item) => !result.map[item])
        }

        for (const restItem of restItems) {
            result.map[restItem] = { err: SEARCH_ERROR_NOT_FOUND, data: null }
        }

        return result
    }
}

module.exports = { StrategyAllItemsToEachPlugin }
