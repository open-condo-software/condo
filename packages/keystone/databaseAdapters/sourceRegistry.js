const conf = require('@open-condo/config')

/**
 * Maps Keystone list (table) names to a logical source name.
 *
 * Source names must match pool names from `DATABASE_POOLS`, or a registered data provider (`kv`, …).
 * Used by BalancingReplicaKnexAdapter.executeFind and CrossDbPlanner.
 *
 * @see packages/keystone/databaseAdapters/README.md
 */

const SOURCE_REGISTRY_PREFIX = 'custom:'

function _parseJsonConfig (value, fallback = {}) {
    if (!value) return fallback
    if (typeof value === 'object') return value
    if (typeof value !== 'string') return fallback

    const normalizedValue = value.startsWith(SOURCE_REGISTRY_PREFIX)
        ? value.substring(SOURCE_REGISTRY_PREFIX.length)
        : value

    return JSON.parse(normalizedValue)
}

/** @returns {{ sourceByTable?: Record<string, string>, defaultSource?: string }} */
function getSourceRegistryConfig (rawConfig = conf.CROSS_DB_SOURCE_REGISTRY) {
    return _parseJsonConfig(rawConfig, {})
}

function isCrossDbPlannerEnabled (rawFlag = conf.CROSS_DB_RELATION_PLANNER_ENABLED) {
    return String(rawFlag) === 'true'
}

/**
 * @param {{ sourceByTable?: Record<string, string>, defaultSource?: string }} [options]
 */
function createSourceRegistry ({ sourceByTable = {}, defaultSource = 'default' } = {}) {
    return {
        sourceByTable,
        defaultSource,
        /** @param {string} tableName Keystone list key / SQL table name */
        resolveSource (tableName) {
            return sourceByTable[tableName] || defaultSource
        },
    }
}

function getSourceRegistry () {
    const parsedConfig = getSourceRegistryConfig()
    return createSourceRegistry({
        sourceByTable: parsedConfig.sourceByTable || {},
        defaultSource: parsedConfig.defaultSource || 'default',
    })
}

module.exports = {
    getSourceRegistry,
    getSourceRegistryConfig,
    isCrossDbPlannerEnabled,
    createSourceRegistry,
}
