const { isDefaultRule } = require('../adapters/BalancingReplicaKnexAdapter/utils/env')
const { isRuleMatching } = require('../adapters/BalancingReplicaKnexAdapter/utils/rules')

/**
 * Resolve which pool stores a table for cross-db logic.
 *
 * Uses the first `DATABASE_ROUTING_RULES` entry with a matching `tableName`
 * (operation-scoped rules do not match when only `{ tableName }` is supplied),
 * otherwise `defaultPool` (catch-all / default writable pool).
 *
 * Independent of which pool executes a given SQL statement (`_selectTargetPoolName`).
 */

/**
 * @param {string} tableName
 * @param {Array} routingRules
 * @returns {string|null}
 */
function _findTablePoolTarget (tableName, routingRules) {
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
 * @param {Array} [options.routingRules]
 * @param {string} options.defaultPool
 * @returns {string}
 */
function resolveTablePool ({ tableName, routingRules, defaultPool }) {
    return _findTablePoolTarget(tableName, routingRules) || defaultPool
}

/**
 * @param {{ routingRules: Array, replicaPoolsConfig: object }} options
 * @returns {{ defaultPool: string, resolveTablePool: (tableName: string) => string }}
 */
function createTablePoolResolver ({ routingRules, replicaPoolsConfig }) {
    const defaultRule = routingRules?.find(isDefaultRule)
    const defaultPool = defaultRule?.target
        || Object.entries(replicaPoolsConfig || {}).find(([, config]) => config.writable && !config.provider)?.[0]
        || 'main'

    const resolve = (tableName) => resolveTablePool({
        tableName,
        routingRules,
        defaultPool,
    })

    return {
        defaultPool,
        resolveTablePool: resolve,
    }
}

/**
 * @param {object} [adapter]
 * @returns {{ defaultPool: string, resolveTablePool: (tableName: string) => string }}
 */
function getTablePoolResolver (adapter) {
    if (adapter && typeof adapter.getTablePoolResolver === 'function') {
        const resolver = adapter.getTablePoolResolver()
        if (resolver) return resolver
    }
    if (adapter?._tablePoolResolver) {
        return adapter._tablePoolResolver
    }

    return {
        defaultPool: 'main',
        resolveTablePool () {
            return 'main'
        },
    }
}

module.exports = {
    resolveTablePool,
    createTablePoolResolver,
    getTablePoolResolver,
}
