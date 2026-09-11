const conf = require('@open-condo/config')

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

function getSourceRegistryConfig (rawConfig = conf.CROSS_DB_SOURCE_REGISTRY) {
    return _parseJsonConfig(rawConfig, {})
}

function getConsistencyMode (rawMode = conf.CROSS_DB_CONSISTENCY_MODE) {
    const consistencyMode = String(rawMode || 'strict').toLowerCase()
    if (consistencyMode === 'eventual') return 'eventual'
    return 'strict'
}

function isCrossDbPlannerEnabled (rawFlag = conf.CROSS_DB_RELATION_PLANNER_ENABLED) {
    return String(rawFlag) === 'true'
}

function createSourceRegistry ({ sourceByTable = {}, defaultSource = 'default' } = {}) {
    return {
        sourceByTable,
        defaultSource,
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
    getConsistencyMode,
    isCrossDbPlannerEnabled,
    createSourceRegistry,
}
