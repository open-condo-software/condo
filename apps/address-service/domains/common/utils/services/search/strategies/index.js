const { get } = require('lodash')

const {
    BULK_SEARCH_STRATEGY_EACH_ITEM_TO_PLUGINS,
    BULK_SEARCH_STRATEGY_ALL_ITEMS_TO_EACH_PLUGIN,
    BULK_SEARCH_STRATEGIES,
} = require('./constants')
const { StrategyAllItemsToEachPlugin } = require('./StrategyAllItemsToEachPlugin')
const { StrategyEachItemToPlugins } = require('./StrategyEachItemToPlugins')

/**
 * @param req
 * @param keystone
 * @param plugins
 * @return {AbstractBulkSearchStrategy}
 */
function createBulkSearchStrategy (req, keystone, plugins) {
    const strategy = String(get(req, ['body', 'strategy'], BULK_SEARCH_STRATEGY_EACH_ITEM_TO_PLUGINS))

    switch (strategy) {
        case BULK_SEARCH_STRATEGY_EACH_ITEM_TO_PLUGINS:
            return new StrategyEachItemToPlugins(keystone, plugins)
        case BULK_SEARCH_STRATEGY_ALL_ITEMS_TO_EACH_PLUGIN:
            return new StrategyAllItemsToEachPlugin(keystone, plugins)
    }

    throw new Error(`Wrong strategy '${strategy}'. Allowed values are: ${BULK_SEARCH_STRATEGIES.join(', ')}`)
}

module.exports = { createBulkSearchStrategy }
