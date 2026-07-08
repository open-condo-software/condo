const { KvDataProvider } = require('./kv')

/**
 * Alternate storage backends keyed by `CROSS_DB_SOURCE_REGISTRY` source name.
 *
 * **Postgres pools are not registered here** — any source name that matches a
 * `DATABASE_POOLS` key uses normal Knex routing via the list adapter.
 *
 * ## Add a new provider
 *
 * 1. Create `dataProviders/<name>.js` with `canFind` / `find` (and other ops when needed).
 * 2. Add one line to `SOURCE_PROVIDERS` below.
 * 3. Map tables in env: `CROSS_DB_SOURCE_REGISTRY=custom:{"sourceByTable":{"MyList":"<name>"}}`
 *
 * @example
 * // dataProviders/mongo.js + SOURCE_PROVIDERS.mongo = MongoDataProvider
 */
const SOURCE_PROVIDERS = {
    kv: KvDataProvider,
}

const _instances = Object.create(null)

/**
 * @param {string} sourceName value from `sourceRegistry.resolveSource(table)`
 * @returns {object|null} provider instance or null for postgres pool sources
 */
function getDataProvider (sourceName) {
    const ProviderClass = SOURCE_PROVIDERS[sourceName]
    if (!ProviderClass) return null
    if (!_instances[sourceName]) {
        _instances[sourceName] = new ProviderClass()
    }
    return _instances[sourceName]
}

/**
 * Whether `sourceName` is handled by the data-provider registry instead of a SQL pool.
 * Used by cross-db planners to reject relation hydration for non-SQL backends.
 *
 * @param {string} sourceName
 * @returns {boolean}
 */
function isDataProviderSource (sourceName) {
    return Boolean(SOURCE_PROVIDERS[sourceName])
}

module.exports = {
    getDataProvider,
    isDataProviderSource,
    SOURCE_PROVIDERS,
}
