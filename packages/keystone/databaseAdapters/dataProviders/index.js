const { KvDataProvider } = require('./kv')

/**
 * Alternate storage backends referenced by `DATABASE_POOLS` provider pools.
 *
 * Postgres pools use `databases: [...]`. Non-SQL backends use `provider: "<name>"`.
 *
 * ## Add a new provider
 *
 * 1. Create `dataProviders/<name>.js` with read/write provider methods.
 * 2. Register in `SOURCE_PROVIDERS` below.
 * 3. Add a pool in `DATABASE_POOLS` and route tables via `DATABASE_ROUTING_RULES`.
 *
 * @example
 * DATABASE_POOLS={"main":{"databases":["main"],"writable":true},"kv":{"provider":"kv","writable":true}}
 * DATABASE_ROUTING_RULES=[{"tableName":"CachedUser","target":"kv"},{"target":"main"}]
 */
const SOURCE_PROVIDERS = {
    kv: KvDataProvider,
}

const REGISTERED_DATA_PROVIDER_NAMES = Object.freeze(Object.keys(SOURCE_PROVIDERS))

const _instances = Object.create(null)

/**
 * @param {string} providerName registered provider key (`kv`, …)
 * @returns {object|null}
 */
function getDataProvider (providerName) {
    const ProviderClass = SOURCE_PROVIDERS[providerName]
    if (!ProviderClass) return null
    if (!_instances[providerName]) {
        _instances[providerName] = new ProviderClass()
    }
    return _instances[providerName]
}

/**
 * @param {string} providerName
 * @returns {boolean}
 */
function isRegisteredDataProvider (providerName) {
    return Boolean(SOURCE_PROVIDERS[providerName])
}

/**
 * Resolves the data provider name for a pool (`DATABASE_POOLS` entry).
 *
 * @param {string} poolName
 * @param {Record<string, { provider?: string }>} [poolsConfig]
 * @returns {string}
 */
function resolvePoolProvider (poolName, poolsConfig = {}) {
    return poolsConfig[poolName]?.provider || poolName
}

/**
 * Whether the pool is backed by a non-SQL data provider instead of Postgres.
 *
 * @param {string} poolName
 * @param {Record<string, { provider?: string }>} [poolsConfig]
 * @returns {boolean}
 */
function isDataProviderPool (poolName, poolsConfig) {
    return isRegisteredDataProvider(resolvePoolProvider(poolName, poolsConfig))
}

module.exports = {
    getDataProvider,
    isRegisteredDataProvider,
    isDataProviderPool,
    resolvePoolProvider,
    SOURCE_PROVIDERS,
    REGISTERED_DATA_PROVIDER_NAMES,
}
