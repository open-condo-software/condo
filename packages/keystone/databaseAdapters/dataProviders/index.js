const {
    executeProviderSqlMutation,
    executeProviderSqlSelect,
    extractMutationWhereIds,
    extractSimpleSelectCondition,
} = require('./executeProviderSql')
const { KvDataProvider } = require('./kv')
const {
    applyItemsQueryToRows,
    providerSupportsFind,
    providerSupportsItemsQuery,
} = require('./providerMethods')

/**
 * Alternate storage backends referenced by `DATABASE_POOLS` provider pools.
 *
 * Postgres pools use `databases: [...]`. Provider pools use `provider: "<name>"`
 * and may list `databases` that are non-postgres URIs in `DATABASE_URL`.
 *
 * ## Add a new provider
 *
 * 1. Create `dataProviders/<name>.js` with read/write methods plus optional:
 *    `static isConnectionUrl(url)`, `static connectionUrlHint`, `connect()`, `disconnect()`.
 * 2. Register in `SOURCE_PROVIDERS` below.
 * 3. Add a pool in `DATABASE_POOLS` and route tables via `DATABASE_ROUTING_RULES`.
 *
 * The Knex adapter reads env, then calls `createConnectedDataProvider` — it does not
 * open Redis/Mongo/etc. clients itself.
 *
 * @example
 * DATABASE_POOLS={"main":{"databases":["main"],"writable":true},"kv":{"provider":"kv","databases":["cache"],"writable":true}}
 * DATABASE_ROUTING_RULES=[{"tableName":"CachedUser","target":"kv"},{"target":"main"}]
 */
const SOURCE_PROVIDERS = {
    kv: KvDataProvider,
}

const REGISTERED_DATA_PROVIDER_NAMES = Object.freeze(Object.keys(SOURCE_PROVIDERS))

const _instances = Object.create(null)

/**
 * Provider instance by registered name (`kv`, …).
 *
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
 * New provider instance (per pool). Use when the pool supplies its own connections.
 *
 * @param {string} providerName
 * @param {object} [options]
 * @returns {object|null}
 */
function createDataProvider (providerName, options = {}) {
    const ProviderClass = SOURCE_PROVIDERS[providerName]
    if (!ProviderClass) return null
    return new ProviderClass(options)
}

/**
 * Provider class registered as `providerName`, or `null`.
 *
 * @param {string} providerName
 * @returns {Function|null}
 */
function getProviderClass (providerName) {
    return SOURCE_PROVIDERS[providerName] || null
}

/**
 * Construct a provider and call `connect()` when the class implements it.
 *
 * @param {string} providerName
 * @param {object} [options]
 * @returns {Promise<object|null>}
 */
async function createConnectedDataProvider (providerName, options = {}) {
    const provider = createDataProvider(providerName, options)
    if (!provider) return null
    try {
        if (typeof provider.connect === 'function') {
            await provider.connect()
        }
        return provider
    } catch (err) {
        if (typeof provider.disconnect === 'function') {
            await provider.disconnect().catch(() => {})
        }
        throw err
    }
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
    createConnectedDataProvider,
    createDataProvider,
    getDataProvider,
    getProviderClass,
    isDataProviderPool,
    resolvePoolProvider,
    REGISTERED_DATA_PROVIDER_NAMES,
    executeProviderSqlMutation,
    executeProviderSqlSelect,
    extractMutationWhereIds,
    extractSimpleSelectCondition,
    applyItemsQueryToRows,
    providerSupportsFind,
    providerSupportsItemsQuery,
}
