/**
 * Cached hints: which lists need cross-db work.
 * Used to keep main-pool-only queries on the cheap path (no SQL AST / remote checks).
 */

/**
 * @param {object|null} listAdapter
 * @returns {Array}
 */
function _iterFieldAdapters (listAdapter) {
    if (listAdapter?.fieldAdapters?.length) return listAdapter.fieldAdapters
    if (listAdapter?.fieldAdaptersByPath) return Object.values(listAdapter.fieldAdaptersByPath)
    return []
}

/**
 * @param {object} adapter BalancingReplicaKnexAdapter (or compatible)
 * @returns {Map<string, boolean>}
 */
function _getCache (adapter, cacheKey) {
    if (!adapter[cacheKey]) adapter[cacheKey] = new Map()
    return adapter[cacheKey]
}

/**
 * @param {object} adapter
 * @param {string} listKey
 * @param {object} [sourceRegistry]
 * @returns {boolean}
 */
function listHasCrossSourceOutbound (adapter, listKey, sourceRegistry = null) {
    const cache = _getCache(adapter, '__crossSourceOutboundCache')
    if (cache.has(listKey)) return cache.get(listKey)

    const registry = sourceRegistry
        || adapter.getSourceRegistry?.()
        || adapter._sourceRegistry
    const listAdapter = adapter.listAdapters?.[listKey]
    if (!registry || !listAdapter) {
        return false
    }

    const baseSource = registry.resolveSource(listKey)
    let result = false
    for (const fieldAdapter of _iterFieldAdapters(listAdapter)) {
        if (!fieldAdapter.isRelationship || !fieldAdapter.refListKey) continue
        if (registry.resolveSource(fieldAdapter.refListKey) !== baseSource) {
            result = true
            break
        }
    }
    cache.set(listKey, result)
    return result
}

/**
 * @param {object} adapter
 * @param {string} listKey
 * @param {object} [sourceRegistry]
 * @returns {boolean}
 */
function listHasCrossSourceInbound (adapter, listKey, sourceRegistry = null) {
    const cache = _getCache(adapter, '__crossSourceInboundCache')
    if (cache.has(listKey)) return cache.get(listKey)

    const registry = sourceRegistry
        || adapter.getSourceRegistry?.()
        || adapter._sourceRegistry
    const listAdapters = adapter.listAdapters || {}
    if (!registry) {
        return false
    }

    const parentSource = registry.resolveSource(listKey)
    let result = false

    for (const [dependentListKey, listAdapter] of Object.entries(listAdapters)) {
        if (dependentListKey === listKey) continue
        if (registry.resolveSource(dependentListKey) === parentSource) continue

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
 * True when GraphQL `where` for `listKey` may need CrossDbPlanner rewrite
 * (own cross-source filters, or nested same-pool filters that embed them).
 *
 * @param {object} adapter
 * @param {string} listKey
 * @param {object} [options]
 * @param {object} [options.sourceRegistry] override when adapter has no registry yet
 * @param {Set<string>} [options.visited]
 * @returns {boolean}
 */
function listNeedsCrossDbWhereRewrite (adapter, listKey, options = {}) {
    const cache = _getCache(adapter, '__crossDbWhereRewriteCache')
    if (cache.has(listKey)) return cache.get(listKey)

    const visited = options.visited || new Set()
    if (visited.has(listKey)) return false
    visited.add(listKey)

    const sourceRegistry = options.sourceRegistry
        || adapter.getSourceRegistry?.()
        || adapter._sourceRegistry
    const listAdapter = adapter.listAdapters?.[listKey]
    if (!sourceRegistry || !listAdapter) {
        return false
    }

    let result = false
    if (listHasCrossSourceOutbound(adapter, listKey, sourceRegistry)) {
        result = true
    } else {
        const baseSource = sourceRegistry.resolveSource(listKey)
        for (const fieldAdapter of _iterFieldAdapters(listAdapter)) {
            if (!fieldAdapter.isRelationship || !fieldAdapter.refListKey) continue
            if (sourceRegistry.resolveSource(fieldAdapter.refListKey) !== baseSource) continue
            if (listNeedsCrossDbWhereRewrite(adapter, fieldAdapter.refListKey, { sourceRegistry, visited })) {
                result = true
                break
            }
        }
    }

    cache.set(listKey, result)
    return result
}

module.exports = {
    listHasCrossSourceOutbound,
    listHasCrossSourceInbound,
    listNeedsCrossDbWhereRewrite,
}
