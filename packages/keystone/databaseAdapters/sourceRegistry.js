const conf = require('@open-condo/config')

const { isDefaultRule } = require('./adapters/BalancingReplicaKnexAdapter/utils/env')
const { isRuleMatching } = require('./adapters/BalancingReplicaKnexAdapter/utils/rules')

/**
 * Maps Keystone list (table) names to a pool name from `DATABASE_POOLS`.
 *
 * Resolved from:
 * 1. Runtime Postgres table introspection per pool
 * 2. `DATABASE_ROUTING_RULES` tableName rules (Postgres and provider pools)
 *
 * @see packages/keystone/databaseAdapters/README.md
 */

function isCrossDbPlannerEnabled (rawFlag = conf.CROSS_DB_RELATION_PLANNER_ENABLED) {
    return String(rawFlag) === 'true'
}

/**
 * Table-specific pool from routing rules (ignores gql/sql operation filters).
 *
 * @param {string} tableName
 * @param {Array} routingRules
 * @returns {string|null}
 */
function _findTableRoutingTarget (tableName, routingRules) {
    for (const rule of routingRules || []) {
        if (!rule.tableName) continue
        if (isRuleMatching(rule, { tableName })) {
            return rule.target
        }
    }
    return null
}

/**
 * @param {object} options
 * @param {string} options.tableName
 * @param {Record<string, Set<string>>} [options.poolTables]
 * @param {Array} [options.routingRules]
 * @param {Record<string, { writable?: boolean, provider?: string }>} [options.replicaPoolsConfig]
 * @param {string} options.defaultPool
 * @returns {string}
 */
function resolveTablePool ({
    tableName,
    poolTables,
    routingRules,
    replicaPoolsConfig,
    defaultPool,
}) {
    const poolsWithTable = Object.entries(poolTables || {})
        .filter(([, tables]) => tables?.has(tableName))
        .map(([poolName]) => poolName)

    if (poolsWithTable.length === 1) {
        return poolsWithTable[0]
    }

    if (poolsWithTable.length > 1) {
        const writablePools = poolsWithTable.filter(
            poolName => replicaPoolsConfig?.[poolName]?.writable !== false
                && !replicaPoolsConfig?.[poolName]?.provider,
        )

        if (writablePools.length === 1) {
            return writablePools[0]
        }

        const routedTarget = _findTableRoutingTarget(tableName, routingRules)
        if (routedTarget && (poolsWithTable.includes(routedTarget) || replicaPoolsConfig?.[routedTarget]?.provider)) {
            return routedTarget
        }

        if (writablePools.length > 0) {
            return writablePools[0]
        }
    }

    const routedTarget = _findTableRoutingTarget(tableName, routingRules)
    if (routedTarget) {
        return routedTarget
    }

    return defaultPool
}

/**
 * @param {{ poolTables: Record<string, Set<string>>, routingRules: Array, replicaPoolsConfig: object }} options
 */
function createPoolBasedSourceRegistry ({ poolTables, routingRules, replicaPoolsConfig }) {
    const defaultRule = routingRules?.find(isDefaultRule)
    const defaultPool = defaultRule?.target
        || Object.entries(replicaPoolsConfig || {}).find(([, config]) => config.writable && !config.provider)?.[0]
        || 'main'

    return {
        defaultSource: defaultPool,
        resolveSource (tableName) {
            return resolveTablePool({
                tableName,
                poolTables,
                routingRules,
                replicaPoolsConfig,
                defaultPool,
            })
        },
    }
}

/**
 * @param {import('./adapters/BalancingReplicaKnexAdapter/adapter')|object} [adapter]
 */
function getSourceRegistry (adapter) {
    if (adapter && typeof adapter.getSourceRegistry === 'function') {
        return adapter.getSourceRegistry()
    }
    if (adapter?._sourceRegistry) {
        return adapter._sourceRegistry
    }

    return {
        defaultSource: 'main',
        resolveSource () {
            return 'main'
        },
    }
}

module.exports = {
    getSourceRegistry,
    isCrossDbPlannerEnabled,
    createPoolBasedSourceRegistry,
    resolveTablePool,
}
