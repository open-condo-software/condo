const { AsyncLocalStorage } = require('async_hooks')

const { getItems } = require('@open-keystone/server-side-graphql-client')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')

const { listNeedsCrossDbWhereRewrite } = require('./crossSourceHints')

const { isDataProviderPool } = require('../dataProviders')
const { getSourceRegistry, isCrossDbPlannerEnabled } = require('../sourceRegistry')
const { castUuidParams, convertPrismaBigInts, getDatabaseAdapter, isPrismaAdapter } = require('../utils')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GLOBAL_QUERY_LIMIT = 1000
const CROSS_DB_RELATION_IDS_HARD_LIMIT = Number(conf.CROSS_DB_RELATION_FILTER_IDS_LIMIT) || 50000
const CROSS_DB_RELATION_MAX_PAGES = Number(conf.CROSS_DB_RELATION_FILTER_MAX_PAGES) ||
    Math.ceil(CROSS_DB_RELATION_IDS_HARD_LIMIT / GLOBAL_QUERY_LIMIT) + 1

/** Skips nested prepareCrossDbWhere while OR-flatten loads base ids via `find`. */
const prepareWhereSkipStorage = new AsyncLocalStorage()

const logger = getLogger()

/**
 * GraphQL-path cross-database planner for `GqlWithKnexLoadList`.
 *
 * When `CROSS_DB_RELATION_PLANNER_ENABLED=true`:
 * 1. Rewrites `where: { relationField: {...} }` → `{ relationField_in: [ids] }`.
 * 2. Hydrates relations from the pool that owns the related table (derived from DATABASE_POOLS).
 *
 * Env: `CROSS_DB_RELATION_PLANNER_ENABLED`, `CROSS_DB_RELATION_FILTER_*`.
 */
class CrossDbPlanner {
    constructor ({
        listKey,
        adapter,
        isPrisma,
        prisma,
        knex,
        singleRelations = [],
        multipleRelations = [],
        listAdapter,
        resolveDbColumn,
        applyPrismaMultipleRelations,
        sourceRegistry,
    }) {
        this.listKey = listKey
        this.adapter = adapter
        this.isPrisma = isPrisma
        this.prisma = prisma
        this.knex = knex
        this.singleRelations = singleRelations
        this.multipleRelations = multipleRelations
        this.listAdapter = listAdapter
        this.resolveDbColumn = resolveDbColumn
        this.applyPrismaMultipleRelations = applyPrismaMultipleRelations
        this.sourceRegistry = sourceRegistry || getSourceRegistry(adapter)
        this.baseSource = this.sourceRegistry.resolveSource(listKey)
        this._relationIdsCache = new Map()
        // When flattening access `OR` branches to base `id_in`, nested prepareWhere
        // must not re-enter OR flattening (would recurse through find → prepareWhere).
        this._flatteningOr = false
    }

    isEnabled () {
        return isCrossDbPlannerEnabled()
    }

    hasCrossSourceRelations () {
        return this.singleRelations.some(([model]) => this._isCrossSourceRelation(model))
    }

    async prepareWhere (initialWhere) {
        if (!this.isEnabled() || !initialWhere || typeof initialWhere !== 'object') {
            return initialWhere
        }
        // relationMap may be empty when this list has no cross-source FKs, but nested
        // same-pool filters (e.g. `{ receipt: { context: … } }` on BillingReceiptFile)
        // still need recursive prepareWhere on the related list.
        const relationMap = this._buildRelationMap()
        return this._rewriteWhereNode(initialWhere, relationMap)
    }

    async loadChunk (mainTableObjects) {
        logger.info({
            msg: 'cross-db relation planner path selected',
            entity: this.listKey,
            count: mainTableObjects.length,
            data: {
                singleRelationsCount: this.singleRelations.length,
                multipleRelationsCount: this.multipleRelations.length,
            },
        })

        if (this.singleRelations.length === 0) {
            return this._applyMultipleRelations(mainTableObjects)
        }

        const hydrated = await this._hydrateSingleRelations(mainTableObjects)
        return this._applyMultipleRelations(hydrated)
    }

    async loadRelatedIds (model, relationWhere) {
        const cacheKey = `${model}:${JSON.stringify(relationWhere)}`
        if (this._relationIdsCache.has(cacheKey)) {
            return this._relationIdsCache.get(cacheKey)
        }

        const { keystone: relatedKeystone } = await getSchemaCtx(model)
        const ids = []
        let skip = 0
        let page = 0
        let reachedTerminalPage = false

        while (page < CROSS_DB_RELATION_MAX_PAGES) {
            page += 1
            const relatedRows = await getItems({
                keystone: relatedKeystone,
                listKey: model,
                where: relationWhere,
                returnFields: 'id',
                sortBy: ['id_ASC'],
                first: GLOBAL_QUERY_LIMIT,
                skip,
            })

            if (relatedRows.length === 0) {
                reachedTerminalPage = true
                break
            }

            ids.push(...relatedRows.map(row => row.id).filter(Boolean))
            if (ids.length > CROSS_DB_RELATION_IDS_HARD_LIMIT) {
                throw new Error(
                    `Cross-db relation filter returned too many ids for ${model}. Limit: ${CROSS_DB_RELATION_IDS_HARD_LIMIT}`,
                )
            }

            if (relatedRows.length < GLOBAL_QUERY_LIMIT) {
                reachedTerminalPage = true
                break
            }
            skip += relatedRows.length
        }

        if (!reachedTerminalPage && page >= CROSS_DB_RELATION_MAX_PAGES) {
            throw new Error(
                `Cross-db relation filter reached page limit for ${model}. Limit: ${CROSS_DB_RELATION_MAX_PAGES}`,
            )
        }

        this._relationIdsCache.set(cacheKey, ids)
        return ids
    }

    _isCrossSourceRelation (model) {
        return this.sourceRegistry.resolveSource(model) !== this.baseSource
    }

    _ensureSqlBackedSource (tableName) {
        const poolName = this.sourceRegistry.resolveSource(tableName)
        if (isDataProviderPool(poolName, this.adapter._replicaPoolsConfig)) {
            throw new Error(
                `Cross-db relation hydration does not support non-SQL pool "${poolName}" (table: ${tableName})`,
            )
        }
        return poolName
    }

    async _fetchRows ({ tableName, columns, values, valueColumn = 'id' }) {
        if (!values.length) return []

        const sourceName = this._ensureSqlBackedSource(tableName)
        if (this.isPrisma) {
            const prismaClient = this._getPrismaClient(sourceName)
            const placeholders = values.map((v, i) => UUID_RE.test(v) ? `$${i + 1}::uuid` : `$${i + 1}`).join(', ')
            const selectClause = columns.map(column => `"${column}"`).join(', ')
            const sql = `SELECT ${selectClause} FROM "${tableName}" WHERE "${valueColumn}" IN (${placeholders})`
            const rows = await prismaClient.$queryRawUnsafe(castUuidParams(sql, values), ...values)
            return convertPrismaBigInts(rows)
        }

        const knexClient = this._getKnexClient(sourceName)
        return knexClient(tableName).select(columns).whereIn(valueColumn, values)
    }

    _getPrismaClient (sourceName) {
        if (this.adapter._prismaClients?.[sourceName]) {
            return this.adapter._prismaClients[sourceName]
        }
        return this.prisma
    }

    _getKnexClient (poolName) {
        const pool = this.adapter._replicaPools?.[poolName]
        if (pool && typeof pool.getKnexClient === 'function' && !this.adapter._replicaPoolsConfig?.[poolName]?.provider) {
            return pool.getKnexClient()
        }
        const dbName = this.adapter._replicaPoolsConfig?.[poolName]?.databases?.[0]
        if (dbName && this.adapter._knexClients?.[dbName]) {
            return this.adapter._knexClients[dbName]
        }
        if (this.adapter._knexClients?.[poolName]) {
            return this.adapter._knexClients[poolName]
        }
        return this.knex
    }

    _getFieldAdapters () {
        if (this.listAdapter?.fieldAdapters?.length) return this.listAdapter.fieldAdapters
        if (this.listAdapter?.fieldAdaptersByPath) return Object.values(this.listAdapter.fieldAdaptersByPath)
        const fromParent = this.adapter?.listAdapters?.[this.listKey]
        if (fromParent?.fieldAdapters?.length) return fromParent.fieldAdapters
        if (fromParent?.fieldAdaptersByPath) return Object.values(fromParent.fieldAdaptersByPath)
        return []
    }

    _buildRelationMap () {
        const relationMap = new Map()

        for (const [model, fieldName] of this.singleRelations) {
            if (fieldName && this._isCrossSourceRelation(model)) {
                relationMap.set(fieldName, model)
            }
        }

        for (const fieldAdapter of this._getFieldAdapters()) {
            if (!fieldAdapter.isRelationship || !fieldAdapter.refListKey) continue
            const fieldName = fieldAdapter.path
            if (relationMap.has(fieldName)) continue
            if (this._isCrossSourceRelation(fieldAdapter.refListKey)) {
                relationMap.set(fieldName, fieldAdapter.refListKey)
            }
        }

        return relationMap
    }

    _isLogicalWhereKey (key) {
        return key === 'AND' || key === 'OR' || key === 'NOT'
    }

    _isDirectIdRelationFilter (value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false
        const keys = Object.keys(value)
        if (keys.length === 0) return false
        const allowed = new Set(['id', 'id_in', 'id_not', 'id_not_in'])
        return keys.every(key => allowed.has(key))
    }

    async _tryRewriteRelationFilter (key, value, relationMap, rewritten) {
        if (await this._rewriteDirectRelation(key, value, relationMap, rewritten)) return true
        if (await this._rewriteNotRelation(key, value, relationMap, rewritten)) return true
        if (await this._rewriteInRelation(key, value, relationMap, rewritten)) return true
        return this._rewriteSamePoolNestedRelation(key, value, rewritten)
    }

    /**
     * Same-pool relation filters can still embed cross-source predicates on the related
     * list (e.g. BillingReceiptFile access `{ receipt: { OR: [{ account…, context… }] } }`).
     * Recursively run prepareWhere for the related list so nested OR/cross-source filters
     * become `{ receipt: { id_in: […] } }` before SQL.
     */
    async _rewriteSamePoolNestedRelation (key, value, rewritten) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false
        if (this._isDirectIdRelationFilter(value)) return false

        const fieldAdapter = this._getFieldAdapters().find(adapter => (
            adapter.isRelationship && adapter.path === key && adapter.refListKey
        ))
        if (!fieldAdapter) return false
        if (this._isCrossSourceRelation(fieldAdapter.refListKey)) return false

        const relatedListKey = fieldAdapter.refListKey
        // Nested rewrite only when the related list (transitively) touches another pool.
        if (this.adapter && !listNeedsCrossDbWhereRewrite(this.adapter, relatedListKey, {
            sourceRegistry: this.sourceRegistry,
        })) {
            return false
        }

        const nestedPlanner = new CrossDbPlanner({
            listKey: relatedListKey,
            adapter: this.adapter,
            isPrisma: this.isPrisma,
            prisma: this.prisma,
            knex: this.knex,
            listAdapter: this.adapter?.listAdapters?.[relatedListKey],
            resolveDbColumn: this.resolveDbColumn,
            applyPrismaMultipleRelations: this.applyPrismaMultipleRelations,
            sourceRegistry: this.sourceRegistry,
        })
        rewritten[key] = await nestedPlanner.prepareWhere(value)
        return true
    }

    /**
     * True when `node` (or any descendant) filters via a cross-source relation field.
     * Used to detect Keystone access `OR: [{ context: { organization: … } }, …]` shapes
     * that become `WHERE false OR (join…)` and cannot be rewritten as a single JOIN filter.
     */
    _nodeHasCrossSourceRelationFilter (node, relationMap) {
        if (!node || typeof node !== 'object') return false
        if (Array.isArray(node)) {
            return node.some(item => this._nodeHasCrossSourceRelationFilter(item, relationMap))
        }

        for (const [key, value] of Object.entries(node)) {
            if (this._isLogicalWhereKey(key)) {
                if (this._nodeHasCrossSourceRelationFilter(value, relationMap)) return true
                continue
            }

            if (relationMap.has(key)) return true

            if (key.endsWith('_not') && relationMap.has(key.slice(0, -4))) return true
            if (key.endsWith('_not_in') && relationMap.has(key.slice(0, -7))) return true
            if (key.endsWith('_in') && relationMap.has(key.slice(0, -3))) return true

            if (value && typeof value === 'object' && this._nodeHasCrossSourceRelationFilter(value, relationMap)) {
                return true
            }
        }
        return false
    }

    /**
     * Resolve OR branches that touch cross-source relations to a base-table `id_in`.
     * Each branch is rewritten (relation filters → FK id_in) then loaded via `find`
     * (no GraphQL access merge), so SQL sees AND-only FK joins — not OR-of-joins.
     */
    async _flattenOrToBaseIds (branches, relationMap) {
        this._flatteningOr = true
        try {
            const idGroups = await Promise.all(branches.map(async (branch) => {
                const rewritten = await this._rewriteWhereNode(branch, relationMap)
                if (isUnsatisfiableWhere(rewritten)) return []
                return this._loadBaseIds(rewritten)
            }))
            return [...new Set(idGroups.flat())]
        } finally {
            this._flatteningOr = false
        }
    }

    async _loadBaseIds (where) {
        // `find` → executeFind → prepareCrossDbWhere; skip re-entry (where is already rewritten).
        const rows = await prepareWhereSkipStorage.run({ skip: true }, () => find(this.listKey, where))
        if (!Array.isArray(rows)) return []

        const ids = rows.map(row => row?.id).filter(Boolean)
        if (ids.length > CROSS_DB_RELATION_IDS_HARD_LIMIT) {
            throw new Error(
                `Cross-db OR flatten returned too many ids for ${this.listKey}. ` +
                `Limit: ${CROSS_DB_RELATION_IDS_HARD_LIMIT}`,
            )
        }
        return ids
    }

    async _rewriteWhereNode (node, relationMap) {
        if (Array.isArray(node)) {
            return Promise.all(node.map(item => this._rewriteWhereNode(item, relationMap)))
        }
        if (!node || typeof node !== 'object') return node

        // Access control often returns `{ OR: [{ context: { organization: … } }] }`.
        // Keystone SQL wraps that as `false OR (join…)`, which the SQL rewriter cannot
        // safely split. Resolve matching base ids instead (skip while already flattening).
        if (
            Array.isArray(node.OR) &&
            !this._flatteningOr &&
            this._nodeHasCrossSourceRelationFilter(node.OR, relationMap)
        ) {
            const ids = await this._flattenOrToBaseIds(node.OR, relationMap)
            const rest = { ...node }
            delete rest.OR
            const restRewritten = await this._rewriteWhereNode(rest, relationMap)
            if (!restRewritten || Object.keys(restRewritten).length === 0) {
                return { id_in: ids }
            }
            if (isUnsatisfiableWhere({ id_in: ids }) || isUnsatisfiableWhere(restRewritten)) {
                return { id_in: [] }
            }
            return { AND: [{ id_in: ids }, restRewritten] }
        }

        const rewritten = {}
        for (const [key, value] of Object.entries(node)) {
            if (this._isLogicalWhereKey(key)) {
                rewritten[key] = await this._rewriteWhereNode(value, relationMap)
                continue
            }

            if (await this._tryRewriteRelationFilter(key, value, relationMap, rewritten)) continue

            rewritten[key] = await this._rewriteWhereNode(value, relationMap)
        }
        return rewritten
    }

    async _rewriteDirectRelation (key, value, relationMap, rewritten) {
        const directModel = relationMap.get(key)
        if (!directModel || !value || typeof value !== 'object' || Array.isArray(value)) return false

        // FK id filters stay as nested GraphQL relation where; SQL cross-pool rewrite handles the join.
        if (this._isDirectIdRelationFilter(value)) return false

        const ids = await this.loadRelatedIds(directModel, value)
        rewritten[key] = { id_in: ids }
        return true
    }

    async _rewriteNotRelation (key, value, relationMap, rewritten) {
        if (!key.endsWith('_not')) return false

        const relationField = key.slice(0, -4)
        const model = relationMap.get(relationField)
        if (!model || !value || typeof value !== 'object' || Array.isArray(value)) return false

        if (this._isDirectIdRelationFilter(value)) return false

        const ids = await this.loadRelatedIds(model, value)
        if (ids.length > 0) rewritten[relationField] = { id_not_in: ids }
        return true
    }

    async _rewriteInRelation (key, value, relationMap, rewritten) {
        if (!key.endsWith('_in') && !key.endsWith('_not_in')) return false

        const suffix = key.endsWith('_not_in') ? '_not_in' : '_in'
        const relationField = key.slice(0, -suffix.length)
        const model = relationMap.get(relationField)
        if (!model || !Array.isArray(value) || !value.every(v => v && typeof v === 'object' && !Array.isArray(v))) {
            return false
        }

        const idsGroups = await Promise.all(value.map(filter => this.loadRelatedIds(model, filter)))
        const ids = [...new Set(idsGroups.flat())]
        if (ids.length === 0) {
            if (suffix !== '_not_in') {
                rewritten[relationField] = { id_in: [] }
            }
            return true
        }

        if (suffix === '_not_in') {
            rewritten[relationField] = { id_not_in: ids }
        } else {
            rewritten[relationField] = { id_in: ids }
        }
        return true
    }

    async _hydrateSingleRelations (mainTableObjects) {
        const ids = mainTableObjects.map(object => object.id)
        const resolvedSingleRelations = this.singleRelations.map(([model, fieldName, value, alias]) => ({
            model,
            fieldName,
            value,
            alias: alias || fieldName,
            dbColumn: this.isPrisma ? this.resolveDbColumn(fieldName) : fieldName,
        }))

        const fkById = await this._loadMainTableFkById(mainTableObjects, resolvedSingleRelations, ids)
        const relationPayload = await this._buildRelationPayload(mainTableObjects, resolvedSingleRelations, fkById)

        return mainTableObjects.map(object => ({ ...object, ...(relationPayload[object.id] || {}) }))
    }

    async _loadMainTableFkById (mainTableObjects, resolvedSingleRelations, ids) {
        const missingFields = resolvedSingleRelations.filter(({ fieldName }) => !(fieldName in (mainTableObjects[0] || {})))
        if (missingFields.length === 0) return {}

        const columns = ['id', ...missingFields.map(({ dbColumn }) => dbColumn)]
        const rows = await this._fetchRows({
            tableName: this.listKey,
            columns,
            values: ids,
        })
        return Object.fromEntries(rows.map(row => [row.id, row]))
    }

    async _buildRelationPayload (mainTableObjects, resolvedSingleRelations, fkById) {
        const relationPayload = {}

        for (const relation of resolvedSingleRelations) {
            const fkValues = [...new Set(mainTableObjects.map(object => {
                if (relation.fieldName in object) return object[relation.fieldName]
                return get(fkById, [object.id, relation.dbColumn], null)
            }).filter(value => value !== null && value !== undefined))]

            if (fkValues.length === 0) continue

            const rows = await this._fetchRows({
                tableName: relation.model,
                columns: ['id', relation.value],
                values: fkValues,
            })
            const lookup = new Map(rows.map(row => [row.id, row[relation.value]]))

            for (const object of mainTableObjects) {
                const fk = relation.fieldName in object
                    ? object[relation.fieldName]
                    : get(fkById, [object.id, relation.dbColumn], null)
                if (!relationPayload[object.id]) relationPayload[object.id] = {}
                if (fk === null || fk === undefined) {
                    relationPayload[object.id][relation.alias] = null
                } else {
                    relationPayload[object.id][relation.alias] = lookup.has(fk) ? lookup.get(fk) : null
                }
            }
        }

        return relationPayload
    }

    async _applyMultipleRelations (mainTableObjects) {
        if (this.multipleRelations.length === 0) return mainTableObjects

        if (!this.isPrisma) {
            throw new Error(
                'Cross-db planner with multipleRelations is not supported for KnexAdapter. ' +
                'Use PrismaAdapter or set CROSS_DB_RELATION_PLANNER_ENABLED=false.',
            )
        }

        return this.applyPrismaMultipleRelations(mainTableObjects)
    }
}

/**
 * @param {object|Array} where GraphQL where after cross-db rewrite
 * @returns {boolean} true when the filter cannot match any row (e.g. `id_in: []`)
 */
function isUnsatisfiableWhere (where) {
    if (!where || typeof where !== 'object') return false

    if (Array.isArray(where)) {
        return where.some(isUnsatisfiableWhere)
    }

    if (Array.isArray(where.id_in) && where.id_in.length === 0) {
        return true
    }

    if (Array.isArray(where.AND) && where.AND.some(isUnsatisfiableWhere)) {
        return true
    }

    for (const [key, value] of Object.entries(where)) {
        if (key === 'AND' || key === 'OR' || key === 'NOT') continue
        // Negated relation/filters (`user_not`, `id_not_in`, …) are satisfiable even with empty id_in
        if (key.endsWith('_not') || key.endsWith('_not_in')) continue
        if (value && typeof value === 'object' && isUnsatisfiableWhere(value)) {
            return true
        }
    }

    return false
}

/**
 * Rewrite GraphQL `where` for cross-source relation filters (e.g. `{ user: { name_contains: 'x' } }` → `{ user: { id_in: [...] } }`).
 * Direct FK id filters (`user: { id_in: [...] }`) are left unchanged; SQL cross-pool rewrite handles them.
 * Used by `GqlWithKnexLoadList` and `loadListByChunks`.
 *
 * @param {{ listKey: string, where: object, adapter?: object }} options
 * @returns {Promise<object>}
 */
async function prepareCrossDbWhere ({ listKey, where, adapter: knownAdapter = null }) {
    // Cheap exits first — no schema lookup / planner construction.
    if (!isCrossDbPlannerEnabled() || !where || typeof where !== 'object') {
        return where
    }
    if (prepareWhereSkipStorage.getStore()?.skip) {
        return where
    }
    // Caller already has the BalancingReplica adapter (hot path): skip getSchemaCtx.
    if (knownAdapter && !listNeedsCrossDbWhereRewrite(knownAdapter, listKey)) {
        return where
    }

    const { keystone } = await getSchemaCtx(listKey)
    const adapter = knownAdapter || getDatabaseAdapter(keystone)

    // Main-pool lists with no path to another pool: leave where untouched.
    if (!listNeedsCrossDbWhereRewrite(adapter, listKey)) {
        return where
    }

    const isPrisma = isPrismaAdapter(keystone)
    const planner = new CrossDbPlanner({
        listKey,
        adapter,
        isPrisma,
        prisma: isPrisma ? adapter.prisma : undefined,
        knex: !isPrisma ? adapter.knex : undefined,
        listAdapter: adapter.listAdapters?.[listKey],
        resolveDbColumn: (fieldName) => fieldName,
        applyPrismaMultipleRelations: async (rows) => rows,
        sourceRegistry: getSourceRegistry(adapter),
    })

    return planner.prepareWhere(where)
}

module.exports = {
    CrossDbPlanner,
    GLOBAL_QUERY_LIMIT,
    isUnsatisfiableWhere,
    prepareCrossDbWhere,
}
