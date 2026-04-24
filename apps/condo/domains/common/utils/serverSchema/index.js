
const { getItems } = require('@open-keystone/server-side-graphql-client')
const { isFunction, isNil } = require('lodash')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getDatabaseAdapter, isPrismaAdapter } = require('@open-condo/keystone/databaseAdapters/utils')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GLOBAL_QUERY_LIMIT = 1000
const TOO_MANY_RETURNED_LOG_LIMITS = Object.freeze([1100, 9000, 14900, 49000, 149000])
const TOO_MANY_RETURNED_RESULT_LOG_LIMIT = 4900
const logger = getLogger()
const TIMEOUT_DURATION = Number(conf.TIMEOUT_CHUNKS_DURATION) ||  60 * 1000

// When we load models with Apollo graphql - every relation on a field for every object makes sql request
// For example, loading 50 tickets will cause a result of ~1000 sql queries which is near server limit
// But we want to keep sortBy and where functionality from gql
// What we do:
// 1. We use gql to load fields from main table with sort and where
// 2. We use knex to load all relations in one sql request for ids in 1.
// 3. We can use aggregate functions from knex on multiple relation fields
// 4. We merge 1 and 2
// 5. We load all data by chunks (size of chunk is equal to global guery sql limit)
// It's about ~4.5 times faster then using only gql queries
// Tested on tickets export for 24755 tickets: without knex  71220.902ms, with knex: 16094.841ms )
// TODO(zuch): find out how to make 1 request for 1. and 2.

function logTooManyReturnedIfRequired (tooManyReturnedLimitCounters, allObjects, { functionName, schemaName, data }) {
    if (!Array.isArray(tooManyReturnedLimitCounters)) throw new Error('logTooManyReturned: wrong argument type')
    if (tooManyReturnedLimitCounters.length <= 0) return  // trying to notify only if have any counter
    const realLimit = tooManyReturnedLimitCounters[0]

    if (allObjects && Array.isArray(allObjects) && allObjects.length > realLimit) {

        logger.warn({
            msg: 'returned too much entities',
            data: {
                tooManyLimit: realLimit,
                data,
            },
            count: allObjects.length,
            functionName,
            listKey: schemaName,
        })
        tooManyReturnedLimitCounters.shift()  // remove counter and mark as already notified
    }
}

/**
 * @deprecated you should use find
 */
class GqlWithKnexLoadList {

    constructor ({ listKey, fields, singleRelations = [], multipleRelations = [], where = {}, sortBy = [] }) {
        if (!Reflect.has(where, 'deletedAt')) {
            where.deletedAt = null
        }
        this.listKey = listKey
        this.fields = fields
        this.where = where
        this.sortBy = sortBy
        this.singleRelations = singleRelations
        this.multipleRelations = multipleRelations
    }

    async load () {
        await this.initContext()
        let skip = 0
        let newchunk = []
        let all = []
        let tooManyReturnedLimitCounters = [...TOO_MANY_RETURNED_LOG_LIMITS]
        let allLength = 0

        const startTime = Date.now()

        let maxiterationsCount = 100 // we need some limits - 100K records is more then enough
        do {
            const now = Date.now()

            if (conf.DISABLE_CHUNKS_TIMEOUT !== 'true' && now - startTime >= TIMEOUT_DURATION) {
                logger.info({
                    msg: 'operation timed out',
                    functionName: 'GqlWithKnexLoadList.load',
                    listKey: this.listKey,
                    data: {
                        singleRelations: this.singleRelations, multipleRelations: this.multipleRelations, where: this.where, fields: this.fields,
                    },
                    count: allLength,
                })

                throw new Error('Operation timed out')
            }

            newchunk = await this.loadChunk(skip)
            allLength += newchunk.length
            all = all.concat(newchunk)
            skip += newchunk.length

            logTooManyReturnedIfRequired(tooManyReturnedLimitCounters, all, {
                functionName: 'GqlWithKnexLoadList.load',
                schemaName: this.listKey,
                data: {
                    singleRelations: this.singleRelations, multipleRelations: this.multipleRelations, where: this.where, fields: this.fields,
                },
            })

            if (newchunk.length < GLOBAL_QUERY_LIMIT) {
                break
            }
        } while (--maxiterationsCount > 0 && newchunk.length)

        logTooManyReturnedIfRequired([TOO_MANY_RETURNED_RESULT_LOG_LIMIT], all, {
            functionName: 'GqlWithKnexLoadList.load',
            schemaName: this.listKey,
            data: {
                singleRelations: this.singleRelations, multipleRelations: this.multipleRelations, where: this.where, fields: this.fields,
            },
        })

        return all
    }

    async loadChunk (offset = 0, limit) {
        await this.initContext()
        const mainTableObjects = await getItems({
            keystone: this.keystone,
            listKey: this.listKey,
            where: this.where,
            sortBy: this.sortBy,
            skip: offset,
            first: limit || GLOBAL_QUERY_LIMIT,
            returnFields: this.fields,
        })
        if (mainTableObjects.length === 0) {
            return []
        }

        if (this._isPrisma) {
            if (this.singleRelations.length === 0 && this.multipleRelations.length === 0) {
                return mainTableObjects
            }
            return this._loadChunkPrisma(mainTableObjects)
        }
        return this._loadChunkKnex(mainTableObjects)
    }

    /** @private */
    async _loadChunkKnex (mainTableObjects) {
        const ids = mainTableObjects.map(object => object.id)
        const knexQuery = this.knex(`${this.listKey} as mainModel`)
        knexQuery.select('mainModel.id')
        if (this.multipleRelations.length !== 0) {
            knexQuery.groupBy('mainModel.id')
        }
        this.singleRelations.forEach(([ Model, fieldName, value, alias ], idx) => {
            knexQuery.select(`sr${idx}.${value} as ${alias || fieldName}`)
            if (this.multipleRelations.length !== 0) {
                knexQuery.groupBy(`sr${idx}.${value}`)
            }
            knexQuery.leftJoin(`${Model} as sr${idx}`, `sr${idx}.id`, `mainModel.${fieldName}`)
        })
        this.multipleRelations.forEach(([select, join], idx) => {
            knexQuery.select(select(idx, this.knex))
            knexQuery.leftJoin(...join(idx))
        })
        knexQuery.whereIn('mainModel.id', ids)
        const joinTablesObjects = await knexQuery
        const main = Object.fromEntries(mainTableObjects.map(object => ([object.id, object])))
        const joins = Object.fromEntries(joinTablesObjects.map(object => ([object.id, object])))
        const merged = {}
        for (const id in main) {
            merged[id] = { ...main[id], ...joins[id] }
        }
        return Object.values(merged)
    }

    /**
     * Application-level join for Prisma adapter (no SQL JOINs).
     * Loads relation data via separate queries per table, then merges results.
     * multipleRelations are supported when each entry has a prismaConfig as the 3rd element:
     *   [knexSelectFn, knexJoinFn, { select, as, table, fk, where }]
     * @private
     */
    async _loadChunkPrisma (mainTableObjects) {
        const ids = mainTableObjects.map(object => object.id)

        // NOTE: For each single relation [Model, fieldName, value, alias]:
        //   - fieldName is the FK column on the main table pointing to Model.id
        //   - value is the column to select from Model
        //   - We query Model separately and map results back by FK
        const relationData = {}
        for (const [Model, fieldName, value, alias] of this.singleRelations) {
            const fkValues = [...new Set(mainTableObjects.map(o => o[fieldName]).filter(Boolean))]
            if (fkValues.length === 0) continue

            const placeholders = fkValues.map((v, i) => UUID_RE.test(v) ? `$${i + 1}::uuid` : `$${i + 1}`).join(', ')
            const sql = `SELECT "id", "${value}" FROM "${Model}" WHERE "id" IN (${placeholders})`
            const rows = await this.prisma.$queryRawUnsafe(sql, ...fkValues)
            const lookup = Object.fromEntries(rows.map(r => [r.id, r[value]]))

            const resultKey = alias || fieldName
            for (const obj of mainTableObjects) {
                const fk = obj[fieldName]
                if (!relationData[obj.id]) relationData[obj.id] = {}
                relationData[obj.id][resultKey] = fk ? (lookup[fk] || null) : null
            }
        }

        // NOTE: Also need main table FK columns if fields didn't include them
        // Load FK values from DB if not already in mainTableObjects
        // DB column names may differ from Keystone field names (e.g. "operator" → "operatorId")
        const missingFkEntries = this.singleRelations
            .map(([, fieldName]) => ({ fieldName, dbCol: this._resolveDbColumn(fieldName) }))
            .filter(({ fieldName }) => mainTableObjects.length > 0 && !(fieldName in mainTableObjects[0]))

        if (missingFkEntries.length > 0) {
            const selectCols = ['id', ...missingFkEntries.map(e => e.dbCol)].map(c => `"${c}"`).join(', ')
            const placeholders = ids.map((v, i) => UUID_RE.test(v) ? `$${i + 1}::uuid` : `$${i + 1}`).join(', ')
            const sql = `SELECT ${selectCols} FROM "${this.listKey}" WHERE "id" IN (${placeholders})`
            const fkRows = await this.prisma.$queryRawUnsafe(sql, ...ids)
            const fkLookup = Object.fromEntries(fkRows.map(r => [r.id, r]))

            // Re-run relation lookups with FK data
            for (const [Model, fieldName, value, alias] of this.singleRelations) {
                if (!(fieldName in (mainTableObjects[0] || {}))) {
                    const dbCol = this._resolveDbColumn(fieldName)
                    const fkValues = [...new Set(fkRows.map(r => r[dbCol]).filter(Boolean))]
                    if (fkValues.length === 0) continue

                    const ph = fkValues.map((v, i) => UUID_RE.test(v) ? `$${i + 1}::uuid` : `$${i + 1}`).join(', ')
                    const relSql = `SELECT "id", "${value}" FROM "${Model}" WHERE "id" IN (${ph})`
                    const rows = await this.prisma.$queryRawUnsafe(relSql, ...fkValues)
                    const lookup = Object.fromEntries(rows.map(r => [r.id, r[value]]))

                    const resultKey = alias || fieldName
                    for (const obj of mainTableObjects) {
                        const fk = get(fkLookup, [obj.id, dbCol])
                        if (!relationData[obj.id]) relationData[obj.id] = {}
                        relationData[obj.id][resultKey] = fk ? (lookup[fk] || null) : null
                    }
                }
            }
        }

        // Handle multipleRelations via separate aggregate queries
        // Each entry: [knexSelectFn, knexJoinFn, prismaConfig]
        // prismaConfig: { select: 'MAX("createdAt")', as: 'startedAt', table: 'TicketChange', fk: 'ticket', where: { statusIdTo: [id1, id2] } }
        const multipleRelationData = {}
        for (const relation of this.multipleRelations) {
            const prismaConfig = relation[2]
            if (!prismaConfig) {
                throw new Error(
                    'GqlWithKnexLoadList: multipleRelations without prismaConfig are not supported with PrismaAdapter. ' +
                    'Add a prismaConfig object { select, as, table, fk, where } as the 3rd element.'
                )
            }

            const { select, as: alias, table, fk, where = {} } = prismaConfig
            const params = []
            let paramIdx = 1

            const idPlaceholders = ids.map((v) => { const idx = paramIdx++; return UUID_RE.test(v) ? `$${idx}::uuid` : `$${idx}` }).join(', ')
            const conditions = [`"${fk}" IN (${idPlaceholders})`]
            params.push(...ids)

            for (const [col, val] of Object.entries(where)) {
                if (Array.isArray(val)) {
                    const ph = val.map((v) => { const idx = paramIdx++; return UUID_RE.test(v) ? `$${idx}::uuid` : `$${idx}` }).join(', ')
                    conditions.push(`"${col}" IN (${ph})`)
                    params.push(...val)
                } else {
                    conditions.push(UUID_RE.test(val) ? `"${col}" = $${paramIdx++}::uuid` : `"${col}" = $${paramIdx++}`)
                    params.push(val)
                }
            }

            const sql = `SELECT "${fk}", ${select} as "${alias}" FROM "${table}" WHERE ${conditions.join(' AND ')} GROUP BY "${fk}"`
            const rows = await this.prisma.$queryRawUnsafe(sql, ...params)

            const lookup = Object.fromEntries(rows.map(r => [r[fk], r[alias]]))
            for (const obj of mainTableObjects) {
                if (!multipleRelationData[obj.id]) multipleRelationData[obj.id] = {}
                multipleRelationData[obj.id][alias] = lookup[obj.id] !== undefined ? lookup[obj.id] : null
            }
        }

        return mainTableObjects.map(obj => ({
            ...obj,
            ...(relationData[obj.id] || {}),
            ...(multipleRelationData[obj.id] || {}),
        }))
    }

    async initContext () {
        const { keystone: modelAdapter } = await getSchemaCtx(this.listKey)
        this.keystone = modelAdapter
        const adapter = getDatabaseAdapter(modelAdapter)
        this._isPrisma = isPrismaAdapter(modelAdapter)
        if (this._isPrisma) {
            this.prisma = adapter.prisma
            this._listAdapter = adapter.listAdapters[this.listKey]
            // Cache actual DB column names for _resolveDbColumn fallback
            const cols = await this.prisma.$queryRawUnsafe(
                'SELECT column_name FROM information_schema.columns WHERE table_name = $1',
                this.listKey
            )
            this._dbColumns = new Set(cols.map(r => r.column_name))
        } else {
            this.knex = adapter.knex
        }
    }

    /**
     * Resolves the actual DB column name for a Keystone FK field path.
     * Uses the Prisma field adapter's rel.columnName when available.
     * Falls back to checking actual DB columns (fieldName, then fieldNameId).
     * @private
     */
    _resolveDbColumn (fieldName) {
        if (!this._listAdapter) return fieldName
        const fa = this._listAdapter.fieldAdaptersByPath[fieldName]
        if (fa && fa.isRelationship && fa.rel && fa.rel.columnName) {
            return fa.rel.columnName
        }
        // Field not in schema — check actual DB columns
        if (this._dbColumns) {
            if (this._dbColumns.has(fieldName)) return fieldName
            if (this._dbColumns.has(fieldName + 'Id')) return fieldName + 'Id'
        }
        return fieldName
    }

    // Takes rawAggregate SQL function and apply it on all objects with id from ids
    async loadAggregate (rawAggregate, ids) {
        if (this._isPrisma) {
            if (ids.length === 0) return {}
            const placeholders = ids.map((v, i) => UUID_RE.test(v) ? `$${i + 1}::uuid` : `$${i + 1}`).join(', ')
            const sql = `SELECT ${rawAggregate} FROM "${this.listKey}" WHERE "id" IN (${placeholders})`
            const [aggregate] = await this.prisma.$queryRawUnsafe(sql, ...ids)
            if (aggregate) {
                for (const key of Object.keys(aggregate)) {
                    if (typeof aggregate[key] === 'bigint') aggregate[key] = Number(aggregate[key])
                }
            }
            return aggregate
        }
        const knexQuery = this.knex(`${this.listKey}`)
        knexQuery.select(this.knex.raw(rawAggregate))
        knexQuery.whereIn('id', ids)
        const [aggregate] = await knexQuery
        return aggregate
    }
}

/**
 * Simple way to load all models
 * @param context
 * @param list
 * @param {Object} where
 * @param {String[]} sortBy
 * @param {Number} chunkSize
 * @param {Number} limit
 * @param {function(Array): Array | Promise<Array>} chunkProcessor A place to use or/and modify just loaded chunk
 * @param fields - returning fields in gql notation
 * @returns {Promise<*[]>}
 * @deprecated you should use find
 */
const loadListByChunks = async ({
    context,
    list,
    where = {},
    sortBy = ['createdAt_ASC'],
    chunkSize = 100,
    limit = 100000,
    chunkProcessor = (chunk) => chunk,
    fields,
}) => {
    if (chunkSize < 1 || limit < 1) throw new Error('Both chunkSize and limit should be > 0')
    if (chunkSize > 100) throw new Error('chunkSize is too large, max 100 allowed')
    let skip = 0
    let maxIterationsCount = Math.ceil(limit / chunkSize)
    let newChunk = []
    let all = []
    let newChunkLength
    let tooManyReturnedLimitCounters = [...TOO_MANY_RETURNED_LOG_LIMITS]

    const startTime = Date.now()

    do {
        const now = Date.now()

        if (conf.DISABLE_CHUNKS_TIMEOUT !== 'true' && now - startTime >= TIMEOUT_DURATION) {
            logger.info({
                msg: 'operation timed out',
                functionName: 'loadListByChunks',
                listKey: get(list, 'gql.SINGULAR_FORM', ''),
                data: {
                    chunkSize,
                    limit,
                    loadListByChunksArgs: { where },
                },
                count: all.length,
            })

            throw new Error('Operation timed out')
        }

        const resolvedFields = !isNil(fields) ? fields : 'id'
        newChunk = await list.getAll(context, where, resolvedFields, { sortBy, first: chunkSize, skip: skip })
        newChunkLength = newChunk.length

        if (newChunkLength > 0) {
            if (isFunction(chunkProcessor)) {
                newChunk = chunkProcessor.constructor.name === 'AsyncFunction'
                    ? await chunkProcessor(newChunk)
                    : chunkProcessor(newChunk)
            }

            skip += newChunkLength
            all = all.concat(newChunk)
        }

        logTooManyReturnedIfRequired(tooManyReturnedLimitCounters, all, {
            functionName: 'loadListByChunks',
            schemaName: get(list, 'gql.SINGULAR_FORM', ''),
            data: {
                where, sortBy, chunkSize,
            },
        })

    } while (--maxIterationsCount > 0 && newChunkLength)

    logTooManyReturnedIfRequired([TOO_MANY_RETURNED_RESULT_LOG_LIMIT], all, {
        functionName: 'loadListByChunks',
        schemaName: get(list, 'gql.SINGULAR_FORM', ''),
        data: {
            where, sortBy, chunkSize,
        },
    })

    return all
}

/**
 * When no records of related model is found for `singleRelations` of `GqlWithKnexLoadList`, then knex returns `{}`.
 * Sometimes, when we are building array of ids of that related objects, we will get ids values with `{}`.
 * This utility filters these `{}` from array.
 * @deprecated
 */
function filterBlankRelatedObjectsFrom (records) {
    return records.filter(record => (
        !(record instanceof Object && Object.keys(record).length === 0)
    ))
}

module.exports = {
    GqlWithKnexLoadList,
    loadListByChunks,
    filterBlankRelatedObjectsFrom,
}
