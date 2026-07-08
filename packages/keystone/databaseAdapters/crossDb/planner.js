const { getItems } = require('@open-keystone/server-side-graphql-client')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { isDataProviderSource } = require('../dataProviders')
const { getSourceRegistry, isCrossDbPlannerEnabled } = require('../sourceRegistry')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GLOBAL_QUERY_LIMIT = 1000
const CROSS_DB_RELATION_IDS_HARD_LIMIT = Number(conf.CROSS_DB_RELATION_FILTER_IDS_LIMIT) || 50000
const CROSS_DB_RELATION_MAX_PAGES = Number(conf.CROSS_DB_RELATION_FILTER_MAX_PAGES) ||
    Math.ceil(CROSS_DB_RELATION_IDS_HARD_LIMIT / GLOBAL_QUERY_LIMIT) + 1

const logger = getLogger()

/**
 * GraphQL-path cross-database planner for `GqlWithKnexLoadList`.
 *
 * When `CROSS_DB_RELATION_PLANNER_ENABLED=true`:
 * 1. Rewrites `where: { relationField: {...} }` → `{ relationField_in: [ids] }`.
 * 2. Hydrates relations from the source named in `CROSS_DB_SOURCE_REGISTRY`.
 *
 * Env: `CROSS_DB_RELATION_PLANNER_ENABLED`, `CROSS_DB_SOURCE_REGISTRY`, `CROSS_DB_RELATION_FILTER_*`.
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
        this.sourceRegistry = sourceRegistry || getSourceRegistry()
        this.baseSource = this.sourceRegistry.resolveSource(listKey)
        this._relationIdsCache = new Map()
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
        const relationMap = this._buildRelationMap()
        if (relationMap.size === 0) return initialWhere
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
        const sourceName = this.sourceRegistry.resolveSource(tableName)
        if (isDataProviderSource(sourceName)) {
            throw new Error(
                `Cross-db relation hydration does not support non-SQL source "${sourceName}" (table: ${tableName})`,
            )
        }
        return sourceName
    }

    async _fetchRows ({ tableName, columns, values, valueColumn = 'id' }) {
        if (!values.length) return []

        const sourceName = this._ensureSqlBackedSource(tableName)
        if (this.isPrisma) {
            const { castUuidParams, convertPrismaBigInts } = require('../utils')
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

    _getKnexClient (sourceName) {
        if (this.adapter._knexClients?.[sourceName]) {
            return this.adapter._knexClients[sourceName]
        }
        return this.knex
    }

    _buildRelationMap () {
        const relationMap = new Map()

        for (const [model, fieldName] of this.singleRelations) {
            if (fieldName && this._isCrossSourceRelation(model)) {
                relationMap.set(fieldName, model)
            }
        }

        if (this.listAdapter?.fieldAdapters) {
            for (const fieldAdapter of this.listAdapter.fieldAdapters) {
                if (!fieldAdapter.isRelationship || !fieldAdapter.refListKey) continue
                const fieldName = fieldAdapter.path
                if (relationMap.has(fieldName)) continue
                if (this._isCrossSourceRelation(fieldAdapter.refListKey)) {
                    relationMap.set(fieldName, fieldAdapter.refListKey)
                }
            }
        }

        return relationMap
    }

    _isLogicalWhereKey (key) {
        return key === 'AND' || key === 'OR' || key === 'NOT'
    }

    async _tryRewriteRelationFilter (key, value, relationMap, rewritten) {
        if (await this._rewriteDirectRelation(key, value, relationMap, rewritten)) return true
        if (await this._rewriteNotRelation(key, value, relationMap, rewritten)) return true
        return this._rewriteInRelation(key, value, relationMap, rewritten)
    }

    async _rewriteWhereNode (node, relationMap) {
        if (Array.isArray(node)) {
            return Promise.all(node.map(item => this._rewriteWhereNode(item, relationMap)))
        }
        if (!node || typeof node !== 'object') return node

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

        rewritten[`${key}_in`] = await this.loadRelatedIds(directModel, value)
        return true
    }

    async _rewriteNotRelation (key, value, relationMap, rewritten) {
        if (!key.endsWith('_not')) return false

        const relationField = key.slice(0, -4)
        const model = relationMap.get(relationField)
        if (!model || !value || typeof value !== 'object' || Array.isArray(value)) return false

        const ids = await this.loadRelatedIds(model, value)
        if (ids.length > 0) rewritten[`${relationField}_not_in`] = ids
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
        if (suffix === '_not_in') {
            if (ids.length > 0) rewritten[key] = ids
        } else {
            rewritten[key] = ids
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
            }).filter(Boolean))]

            if (fkValues.length === 0) continue

            const rows = await this._fetchRows({
                tableName: relation.model,
                columns: ['id', relation.value],
                values: fkValues,
            })
            const lookup = Object.fromEntries(rows.map(row => [row.id, row[relation.value]]))

            for (const object of mainTableObjects) {
                const fk = relation.fieldName in object
                    ? object[relation.fieldName]
                    : get(fkById, [object.id, relation.dbColumn], null)
                if (!relationPayload[object.id]) relationPayload[object.id] = {}
                relationPayload[object.id][relation.alias] = fk ? (lookup[fk] || null) : null
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

module.exports = {
    CrossDbPlanner,
    GLOBAL_QUERY_LIMIT,
}
