/**
 * Cached boolean hints: does this list touch another DB pool?
 *
 * Callers (adapter mutation guards, CrossDbPlanner) use these to skip expensive
 * cross-db work when a request stays on a **single pool**.
 *
 * Terminology:
 * - **Outbound** — this list has an FK to a table on another pool
 *   (e.g. Message.user → User when Message is on `message` and User on another pool).
 * - **Inbound** — some other-pool list has an FK pointing at this list
 *   (e.g. BillingReceipt.organization → Organization).
 *
 * Pool ownership comes from `resolveTablePool` / routing `tableName` rules.
 */

const { getTablePoolResolver } = require('./tablePool')

/** Relationship field adapters from a Keystone list adapter (array or by-path map). */
function _iterFieldAdapters (listAdapter) {
    if (listAdapter?.fieldAdapters?.length) return listAdapter.fieldAdapters
    if (listAdapter?.fieldAdaptersByPath) return Object.values(listAdapter.fieldAdaptersByPath)
    return []
}

/** Lazy Map on the adapter instance so hints survive across requests without a global cache. */
function _getCache (adapter, cacheKey) {
    if (!adapter[cacheKey]) adapter[cacheKey] = new Map()
    return adapter[cacheKey]
}

/**
 * True if `listKey` has at least one relationship whose target list lives on a different pool.
 *
 * Used before insert/update FK validation: if false, skip `validateCrossSourceReferences`.
 *
 * Example: BillingReceipt → Organization across pools → true for BillingReceipt.
 *
 * @param {object} adapter BalancingReplicaKnexAdapter (or compatible)
 * @param {string} listKey Keystone list / table name
 * @param {object} [tablePoolResolver] optional override; defaults to adapter resolver
 * @returns {boolean}
 */
function listHasCrossSourceOutbound (adapter, listKey, tablePoolResolver = null) {
    const cache = _getCache(adapter, '__crossSourceOutboundCache')
    if (cache.has(listKey)) return cache.get(listKey)

    const resolver = tablePoolResolver || getTablePoolResolver(adapter)
    const listAdapter = adapter.listAdapters?.[listKey]
    if (!resolver || !listAdapter) {
        return false
    }

    const basePool = resolver.resolveTablePool(listKey)
    let result = false
    for (const fieldAdapter of _iterFieldAdapters(listAdapter)) {
        if (!fieldAdapter.isRelationship || !fieldAdapter.refListKey) continue
        if (resolver.resolveTablePool(fieldAdapter.refListKey) !== basePool) {
            result = true
            break
        }
    }
    cache.set(listKey, result)
    return result
}

/**
 * True if some list on another pool has an FK pointing at `listKey`.
 *
 * Used before SQL DELETE: if false, skip `enforceCrossSourceDeleteConstraints`.
 * Only counts FKs stored on the dependent list’s own table (skips join/through tables).
 *
 * Example: BillingReceipt.organization → Organization → true for Organization.
 *
 * @param {object} adapter BalancingReplicaKnexAdapter (or compatible)
 * @param {string} listKey parent list that others may reference
 * @param {object} [tablePoolResolver] optional override; defaults to adapter resolver
 * @returns {boolean}
 */
function listHasCrossSourceInbound (adapter, listKey, tablePoolResolver = null) {
    const cache = _getCache(adapter, '__crossSourceInboundCache')
    if (cache.has(listKey)) return cache.get(listKey)

    const resolver = tablePoolResolver || getTablePoolResolver(adapter)
    const listAdapters = adapter.listAdapters || {}
    if (!resolver) {
        return false
    }

    const parentPool = resolver.resolveTablePool(listKey)
    let result = false

    for (const [dependentListKey, listAdapter] of Object.entries(listAdapters)) {
        if (dependentListKey === listKey) continue
        if (resolver.resolveTablePool(dependentListKey) === parentPool) continue

        for (const fieldAdapter of _iterFieldAdapters(listAdapter)) {
            if (!fieldAdapter.isRelationship || fieldAdapter.refListKey !== listKey) continue
            const fkTable = fieldAdapter.rel?.tableName
            if (fkTable && fkTable !== dependentListKey) continue
            result = true
            break
        }
        if (result) break
    }

    cache.set(listKey, result)
    return result
}

/**
 * True if GraphQL `where` on `listKey` may need CrossDbPlanner rewrite.
 *
 * That is: this list has outbound cross-pool relations, **or** a same-pool nested
 * relation whose related list eventually needs rewrite (so filters like
 * `{ context: { organization: { … } } }` still get rewritten).
 *
 * Single-pool lists return false → leave `where` untouched (cheap path).
 *
 * @param {object} adapter
 * @param {string} listKey
 * @param {object} [options]
 * @param {object} [options.tablePoolResolver] override when adapter has no resolver yet
 * @param {Set<string>} [options.visited] recursion guard for relation cycles
 * @returns {boolean}
 */
function listNeedsCrossDbWhereRewrite (adapter, listKey, options = {}) {
    const cache = _getCache(adapter, '__crossDbWhereRewriteCache')
    if (cache.has(listKey)) return cache.get(listKey)

    const visited = options.visited || new Set()
    if (visited.has(listKey)) {
        if (options.state) options.state.cycleAffected = true
        return false
    }
    visited.add(listKey)

    const tablePoolResolver = options.tablePoolResolver || getTablePoolResolver(adapter)
    const listAdapter = adapter.listAdapters?.[listKey]
    if (!tablePoolResolver || !listAdapter) {
        return false
    }

    const state = options.state || { cycleAffected: false }
    let result = false
    if (listHasCrossSourceOutbound(adapter, listKey, tablePoolResolver)) {
        result = true
    } else {
        const basePool = tablePoolResolver.resolveTablePool(listKey)
        for (const fieldAdapter of _iterFieldAdapters(listAdapter)) {
            if (!fieldAdapter.isRelationship || !fieldAdapter.refListKey) continue
            if (tablePoolResolver.resolveTablePool(fieldAdapter.refListKey) !== basePool) continue
            if (listNeedsCrossDbWhereRewrite(adapter, fieldAdapter.refListKey, { tablePoolResolver, visited, state })) {
                result = true
                break
            }
        }
    }

    if (!state.cycleAffected) {
        cache.set(listKey, result)
    }
    return result
}

module.exports = {
    listHasCrossSourceOutbound,
    listHasCrossSourceInbound,
    listNeedsCrossDbWhereRewrite,
}
