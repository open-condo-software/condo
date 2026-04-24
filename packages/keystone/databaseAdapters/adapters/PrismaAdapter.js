const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const { PrismaAdapter: OriginalPrismaAdapter, PrismaListAdapter, PrismaFieldAdapter } = require('@open-keystone/adapter-prisma')
const { Decimal, Relationship } = require('@open-keystone/fields')
const { mapKeys } = require('@open-keystone/utils')

const { getLogger } = require('@open-condo/keystone/logging')

const _PrismaDecimalInterface = Decimal.adapters.prisma
const _PrismaRelationshipInterface = Relationship.adapters.prisma
const logger = getLogger('PrismaAdapter')

function _sanitizeEmptyOrConditions (obj) {
    if (obj === null || obj === undefined) return obj
    if (Array.isArray(obj)) return obj.map(_sanitizeEmptyOrConditions)
    if (typeof obj !== 'object') return obj
    const proto = Object.getPrototypeOf(obj)
    if (proto !== Object.prototype && proto !== null) return obj
    if (Array.isArray(obj.OR) && obj.OR.length === 0) {
        return { id: { in: [] } }
    }
    const result = {}
    for (const [key, value] of Object.entries(obj)) {
        result[key] = _sanitizeEmptyOrConditions(value)
    }
    return result
}

const MAX_PRISMA_BIND_VALUES = 12000
const CHUNK_QUERY_CONCURRENCY = Math.max(1, parseInt(process.env.PRISMA_ADAPTER_CHUNK_CONCURRENCY || '6', 10))
const PERF_LOG_ENABLED = process.env.PRISMA_ADAPTER_PROFILE === '1'

function _isPlainObject (value) {
    if (!value || typeof value !== 'object') return false
    const proto = Object.getPrototypeOf(value)
    return proto === Object.prototype || proto === null
}

function _stableStringify (value) {
    if (Array.isArray(value)) return `[${value.map(_stableStringify).join(',')}]`
    if (value && typeof value === 'object') {
        if (value instanceof Date) {
            return JSON.stringify({ __type: 'Date', v: Number.isNaN(value.getTime()) ? null : value.toISOString() })
        }
        if (value instanceof RegExp) {
            return JSON.stringify({ __type: 'RegExp', v: `${value.source}/${value.flags}` })
        }
        if (Buffer.isBuffer(value)) {
            return JSON.stringify({ __type: 'Buffer', v: value.toString('base64') })
        }
        if (value instanceof Map) {
            const pairs = Array.from(value.entries())
                .map(([k, v]) => [_stableStringify(k), _stableStringify(v)])
                .sort(([a], [b]) => a.localeCompare(b))
            return JSON.stringify({ __type: 'Map', v: pairs })
        }
        if (value instanceof Set) {
            const setValues = Array.from(value.values())
                .map(_stableStringify)
                .sort((a, b) => a.localeCompare(b))
            return JSON.stringify({ __type: 'Set', v: setValues })
        }
        if (!_isPlainObject(value)) {
            return JSON.stringify({ __type: value.constructor ? value.constructor.name : 'Object', v: String(value) })
        }
        const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
        return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${_stableStringify(v)}`).join(',')}}`
    }
    return JSON.stringify(value)
}

function _cloneWithPathValue (value, path, replacement, depth = 0) {
    if (depth === path.length) return replacement
    const key = path[depth]
    if (Array.isArray(value)) {
        const cloned = value.slice()
        cloned[key] = _cloneWithPathValue(value[key], path, replacement, depth + 1)
        return cloned
    }
    const cloned = { ...(value || {}) }
    cloned[key] = _cloneWithPathValue(value ? value[key] : undefined, path, replacement, depth + 1)
    return cloned
}

async function _runWithConcurrency (items, concurrency, worker) {
    if (!Array.isArray(items) || items.length === 0) return []
    const limit = Math.max(1, concurrency || 1)
    const results = new Array(items.length)
    let nextIndex = 0
    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex
            nextIndex += 1
            results[currentIndex] = await worker(items[currentIndex], currentIndex)
        }
    })
    await Promise.all(runners)
    return results
}

function _logAdapterPerf (payload) {
    if (!PERF_LOG_ENABLED) return
    logger.info({
        msg: 'Prisma adapter perf event',
        data: payload,
    })
}

function _estimateBindValues (node) {
    if (Array.isArray(node)) return node.reduce((acc, value) => acc + _estimateBindValues(value), 0)
    if (!node || typeof node !== 'object') return 1
    let count = 0
    for (const [key, value] of Object.entries(node)) {
        if (key === 'in' && Array.isArray(value)) {
            count += value.length
        } else {
            count += _estimateBindValues(value)
        }
    }
    return count
}

function _findBestChunkCandidatePath (node, path = []) {
    let best = null

    const register = (candidatePath, size) => {
        if (size <= 1) return
        if (!best || size > best.size) best = { path: candidatePath, size }
    }

    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            const found = _findBestChunkCandidatePath(node[i], [...path, i])
            if (found && (!best || found.size > best.size)) best = found
        }
        return best
    }
    if (!node || typeof node !== 'object') return best

    if (Array.isArray(node.in)) {
        register([...path, 'in'], node.in.length)
    }
    if (Array.isArray(node.OR)) {
        register([...path, 'OR'], node.OR.length)
    }

    for (const [key, value] of Object.entries(node)) {
        const found = _findBestChunkCandidatePath(value, [...path, key])
        if (found && (!best || found.size > best.size)) best = found
    }
    return best
}

function _getByPath (obj, path) {
    return path.reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

function _buildChunkedFiltersForLargeIn (filter) {
    if (!filter || !filter.where) return null
    const estimatedBindCount = _estimateBindValues(filter.where)
    if (estimatedBindCount <= MAX_PRISMA_BIND_VALUES) return null
    const candidate = _findBestChunkCandidatePath(filter.where, ['where'])
    if (!candidate || !candidate.path) return null
    const splitValues = _getByPath(filter, candidate.path)
    if (!Array.isArray(splitValues) || splitValues.length <= 1) return null
    const neededChunkCount = Math.ceil(estimatedBindCount / MAX_PRISMA_BIND_VALUES)
    const splitChunkSize = Math.max(1, Math.ceil(splitValues.length / neededChunkCount))

    const chunked = []
    for (let i = 0; i < splitValues.length; i += splitChunkSize) {
        const chunk = splitValues.slice(i, i + splitChunkSize)
        const chunkFilter = _cloneWithPathValue(filter, candidate.path, chunk)
        chunked.push(chunkFilter)
    }
    return chunked
}

function _stripPaginationFromFilter (filter) {
    if (!filter || typeof filter !== 'object') return filter
    const normalizedFilter = { ...filter }
    delete normalizedFilter.skip
    delete normalizedFilter.take
    delete normalizedFilter.cursor
    return normalizedFilter
}

function _stripOrderAndPaginationFromFilter (filter) {
    if (!filter || typeof filter !== 'object') return filter
    const normalizedFilter = _stripPaginationFromFilter(filter)
    delete normalizedFilter.orderBy
    delete normalizedFilter.distinct
    delete normalizedFilter.select
    delete normalizedFilter.include
    return normalizedFilter
}

function _chunkArray (items, size) {
    const chunks = []
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size))
    }
    return chunks
}

function _applyGlobalPaginationToIds (ids, filter) {
    let normalizedIds = ids
    const cursorId = filter && filter.cursor && filter.cursor.id
    if (cursorId !== undefined && cursorId !== null) {
        const cursorIndex = normalizedIds.indexOf(cursorId)
        if (cursorIndex >= 0) normalizedIds = normalizedIds.slice(cursorIndex + 1)
    }
    const skip = Number.isInteger(filter && filter.skip) ? Math.max(0, filter.skip) : 0
    const take = Number.isInteger(filter && filter.take) ? Math.max(0, filter.take) : undefined
    normalizedIds = skip > 0 ? normalizedIds.slice(skip) : normalizedIds
    if (take !== undefined) normalizedIds = normalizedIds.slice(0, take)
    return normalizedIds
}

PrismaListAdapter.prototype._itemsQuery = async function (args, { meta = false, from = {} } = {}) {
    const startedAt = Date.now()
    const filter = await this.prismaFilter({ args, meta, from })
    const chunkedFilters = _buildChunkedFiltersForLargeIn(filter)

    if (meta) {
        let count
        if (chunkedFilters) {
            const counts = await _runWithConcurrency(chunkedFilters, CHUNK_QUERY_CONCURRENCY, chunkFilter => this.model.count(chunkFilter))
            count = counts.reduce((acc, value) => acc + value, 0)
        } else {
            count = await this.model.count(filter)
        }
        const { first, skip } = args

        if (skip !== undefined) {
            count -= skip
        }
        if (first !== undefined) {
            count = Math.min(count, first)
        }
        count = Math.max(0, count)
        _logAdapterPerf({
            list: this.key,
            phase: 'itemsQueryMeta',
            elapsedMs: Date.now() - startedAt,
            chunkCount: chunkedFilters ? chunkedFilters.length : 0,
        })
        return { count }
    }

    let items
    if (chunkedFilters) {
        const chunkFiltersForIdScan = chunkedFilters.map(chunkFilter => ({
            ..._stripOrderAndPaginationFromFilter(chunkFilter),
            select: { id: true },
        }))
        const uniqueIds = []
        const seenIds = new Set()
        const hasTake = Number.isInteger(filter.take) && filter.take >= 0
        const hasCursor = !!(filter && filter.cursor && filter.cursor.id !== undefined && filter.cursor.id !== null)
        const skip = Number.isInteger(filter.skip) ? Math.max(0, filter.skip) : 0
        const idsLimit = hasTake && !hasCursor ? skip + filter.take : null
        for (const chunkFilter of chunkFiltersForIdScan) {
            const part = await this.model.findMany(chunkFilter)
            for (const item of part) {
                const id = item && item.id
                if (id === null || id === undefined || seenIds.has(id)) continue
                seenIds.add(id)
                uniqueIds.push(id)
                if (idsLimit !== null && uniqueIds.length >= idsLimit) break
            }
            if (idsLimit !== null && uniqueIds.length >= idsLimit) break
        }
        const pagedIds = _applyGlobalPaginationToIds(uniqueIds, filter)
        if (pagedIds.length === 0) {
            items = []
        } else {
            const baseFilter = _stripPaginationFromFilter({ ...filter })
            delete baseFilter.orderBy
            delete baseFilter.cursor
            const rowById = new Map()
            const idChunks = _chunkArray(pagedIds, MAX_PRISMA_BIND_VALUES)
            const rowParts = await _runWithConcurrency(idChunks, CHUNK_QUERY_CONCURRENCY, async idsChunk => {
                return this.model.findMany({
                    ...baseFilter,
                    where: { id: { in: idsChunk } },
                })
            })
            for (const rowPart of rowParts) {
                for (const row of rowPart) {
                    if (row && row.id !== undefined && !rowById.has(row.id)) {
                        rowById.set(row.id, row)
                    }
                }
            }
            items = pagedIds.map(id => rowById.get(id)).filter(Boolean)
        }
    } else {
        items = await this.model.findMany(filter)
    }

    _logAdapterPerf({
        list: this.key,
        phase: 'itemsQuery',
        elapsedMs: Date.now() - startedAt,
        chunkCount: chunkedFilters ? chunkedFilters.length : 0,
        resultCount: items.length,
    })
    return items.map(item => this._mapResultItem(item))
}

if (!PrismaListAdapter.prototype._coerceId) {
    PrismaListAdapter.prototype._getIdTypeForList = function (listKey) {
        const listAdapter = listKey === this.key ? this : this.getListAdapterByKey(listKey)
        if (!listAdapter) return 'Int'
        if (listAdapter._idType) return listAdapter._idType
        const idField = listAdapter.fieldAdapters && listAdapter.fieldAdapters.find(f => f.path === 'id')
        if (idField) {
            const schema = idField.getPrismaSchema()
            if (schema && schema.length > 0) {
                const match = schema[0].match(/id\s+(\w+)/)
                if (match) {
                    listAdapter._idType = match[1]
                    return listAdapter._idType
                }
            }
        }
        listAdapter._idType = 'Int'
        return listAdapter._idType
    }

    PrismaListAdapter.prototype._coerceId = function (value, refListKey) {
        if (value === null || value === undefined) return value
        const type = this._getIdTypeForList(refListKey)
        const isString = String(type).toLowerCase() === 'string'
        if (Array.isArray(value)) {
            return value.map(v => this._coerceId(v, refListKey))
        }
        if (isString) {
            return String(value)
        } else {
            const n = Number(value)
            return Number.isNaN(n) ? null : n
        }
    }

    PrismaListAdapter.prototype._mapResultItem = function (item) {
        if (!item) return item
        for (const fa of this.fieldAdapters) {
            if (!fa.isRelationship) continue
            const p = fa.path
            const fkPath = p + 'Fk'
            const idPath = p + 'Id'
            if (item.hasOwnProperty(fkPath)) {
                item[p] = item[fkPath]
            } else if (item.hasOwnProperty(idPath) && !item.hasOwnProperty(p)) {
                item[p] = item[idPath]
            }
            const val = item[p]
            if (val !== null && val !== undefined) {
                if (Array.isArray(val)) {
                    item[p] = val.map(obj => (obj && obj.id) ? obj.id : obj)
                } else if (typeof val === 'object' && val.id !== undefined) {
                    item[p] = val.id
                }
            }
        }
        return item
    }

    PrismaListAdapter.prototype._create = async function (_data) {
        const include = this._include()
        const data = mapKeys(_data, (value, path) => {
            const adapter = this.fieldAdaptersByPath[path]
            if (adapter && adapter.isRelationship) {
                const refListKey = adapter.refListKey
                if (value === null || value === undefined) return undefined
                if (Array.isArray(value)) {
                    const vs = value
                        .map(x => this._coerceId(x, refListKey))
                        .filter(v => v !== null && v !== undefined)
                    return vs.length ? { connect: vs.map(id => ({ id })) } : undefined
                }
                const id = this._coerceId(value, refListKey)
                return id === null || id === undefined ? undefined : { connect: { id } }
            }
            if (adapter && adapter.gqlToPrisma) {
                return adapter.gqlToPrisma(value)
            }
            return value
        })
        return this.model.create({ data, include }).then(item => this._mapResultItem(item))
    }

    PrismaListAdapter.prototype._update = async function (id, _data) {
        const include = this._include()
        const whereId = this._coerceId(id, this.key)
        const existingItem = await this.model.findUnique({ where: { id: whereId }, include })
        return this.model.update({
            where: { id: whereId },
            data: mapKeys(_data, (value, path) => {
                const adapter = this.fieldAdaptersByPath[path]
                if (adapter && adapter.isRelationship && Array.isArray(value)) {
                    const refListKey = adapter.refListKey
                    const vs = value
                        .map(x => this._coerceId(x, refListKey))
                        .filter(v => v !== null && v !== undefined)
                    const existingRaw = existingItem[path] || []
                    const existingIds = existingRaw.map(({ id }) => id)
                    const toDisconnect = existingRaw.filter(({ id }) => !vs.includes(id))
                    const toConnect = vs.filter(id => !existingIds.includes(id)).map(id => ({ id }))
                    return {
                        disconnect: toDisconnect.length ? toDisconnect : undefined,
                        connect: toConnect.length ? toConnect : undefined,
                    }
                }
                if (adapter && adapter.isRelationship) {
                    const refListKey = adapter.refListKey
                    if (value === null) return { disconnect: true }
                    if (value === undefined) return undefined
                    const relId = this._coerceId(value, refListKey)
                    return relId === null || relId === undefined
                        ? undefined
                        : { connect: { id: relId } }
                }
                if (adapter && adapter.gqlToPrisma) {
                    return adapter.gqlToPrisma(value)
                }
                return value
            }),
            include,
        }).then(item => this._mapResultItem(item))
    }

    PrismaListAdapter.prototype._delete = async function (id) {
        const whereId = this._coerceId(id, this.key)
        return this.model.delete({ where: { id: whereId } }).then(item => this._mapResultItem(item))
    }
}

PrismaListAdapter.prototype.processWheres = async function (where, context = null) {
    const isRootCall = !context
    const callStartedAt = Date.now()
    const sharedContext = context || {
        relationFilterCache: new Map(),
        findManyCache: new Map(),
    }
    const _resolveRelationshipScalarPath = (listAdapter, relationshipPath) => {
        const collisionFk = `${relationshipPath}Fk`
        const standardFk = `${relationshipPath}Id`
        const modelName = listAdapter.key.slice(0, 1).toLowerCase() + listAdapter.key.slice(1)
        const runtimeModel = this.parentAdapter?.prisma?._runtimeDataModel?.models?.[modelName]
        const runtimeFieldNames = new Set((runtimeModel?.fields || []).map(field => field.name))

        // Prefer fields that are definitely present in the generated Prisma model.
        if (runtimeFieldNames.has(collisionFk)) return collisionFk
        if (runtimeFieldNames.has(standardFk)) return standardFk

        if (listAdapter.fieldAdaptersByPath[collisionFk]) return collisionFk
        if (listAdapter.fieldAdaptersByPath[standardFk]) return standardFk
        const relationshipAdapter = listAdapter.fieldAdaptersByPath[relationshipPath]
        if (relationshipAdapter && relationshipAdapter.dbPath && relationshipAdapter.dbPath !== relationshipPath) {
            return relationshipAdapter.dbPath
        }
        // Use Id fallback for relation scalar filtering to avoid relation operators (`is/some`)
        // which can produce JOIN-oriented SQL or validation errors for scalar operators.
        return standardFk
    }

    const _idsToFilter = (path, ids, { negate = false, includeNull = false } = {}) => {
        if (!Array.isArray(ids) || ids.length === 0) {
            if (negate) return {}
            return { id: { in: [] } }
        }
        if (!negate) return { [path]: { in: ids } }
        if (includeNull) {
            return {
                OR: [
                    { [path]: null },
                    { NOT: { [path]: { in: ids } } },
                ],
            }
        }
        return { NOT: { [path]: { in: ids } } }
    }

    const _uniqueNonNull = values => {
        const seen = new Set()
        for (const value of values) {
            if (value === null || value === undefined) continue
            seen.add(value)
        }
        return Array.from(seen.values())
    }

    const _chunkIds = ids => {
        const chunks = []
        for (let i = 0; i < ids.length; i += MAX_PRISMA_BIND_VALUES) {
            chunks.push(ids.slice(i, i + MAX_PRISMA_BIND_VALUES))
        }
        return chunks
    }

    const _findManyWithChunking = async (listKey, model, query) => {
        const normalizedQuery = {
            ...query,
            where: query?.where || {},
        }
        const cacheKey = `${listKey}:${_stableStringify(normalizedQuery)}`
        if (sharedContext.findManyCache.has(cacheKey)) {
            return sharedContext.findManyCache.get(cacheKey)
        }
        const chunkedQueries = _buildChunkedFiltersForLargeIn(normalizedQuery)
        const pending = (async () => {
            if (!chunkedQueries) return model.findMany(normalizedQuery)
            const parts = await _runWithConcurrency(chunkedQueries, CHUNK_QUERY_CONCURRENCY, chunkQuery => model.findMany(chunkQuery))
            const rows = []
            for (const part of parts) rows.push(...part)
            return rows
        })()
        sharedContext.findManyCache.set(cacheKey, pending)
        if (chunkedQueries) {
            _logAdapterPerf({
                list: this.key,
                phase: 'relationFindManyChunked',
                targetList: listKey,
                chunkCount: chunkedQueries.length,
            })
        }
        return pending
    }

    const _isEmptyWhere = value =>
        value === undefined ||
        value === null ||
        (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)

    const _filterByRelatedIdsThroughFk = async (fieldAdapter, relWhere, constraintType = 'is') => {
        const rel = fieldAdapter.rel
        if (!rel || !rel.left) return { id: { in: [] } }
        const relationCacheKey = `${this.key}:${fieldAdapter.path}:${constraintType}:${_stableStringify(relWhere || {})}`
        if (sharedContext.relationFilterCache.has(relationCacheKey)) {
            return sharedContext.relationFilterCache.get(relationCacheKey)
        }
        const remember = result => {
            sharedContext.relationFilterCache.set(relationCacheKey, result)
            return result
        }

        const refListAdapter = this.getListAdapterByKey(fieldAdapter.refListKey)
        const relatedRows = await _findManyWithChunking(refListAdapter.key, refListAdapter.model, {
            where: relWhere || {},
            select: { id: true },
            relationLoadStrategy: 'query',
        })
        const relatedIds = _uniqueNonNull(relatedRows.map(row => row.id))

        const isCurrentOnLeft = rel.left && rel.left.listKey === this.key && rel.left.path === fieldAdapter.path
        const isCurrentOnRight = rel.right && rel.right.listKey === this.key && rel.right.path === fieldAdapter.path

        const storesForeignKeyOnCurrentRow = fieldAdapter && fieldAdapter.field && !fieldAdapter.field.many

        // Current list stores FK on its own row (to-one relationship field)
        if (storesForeignKeyOnCurrentRow) {
            const currentPath = isCurrentOnLeft ? rel.left.path : isCurrentOnRight ? rel.right.path : null
            if (!currentPath) return remember({ id: { in: [] } })
            const fkPath = _resolveRelationshipScalarPath(this, currentPath)
            if (_isEmptyWhere(relWhere)) {
                if (constraintType === 'is' || constraintType === 'some' || constraintType === 'every') {
                    return remember({ [fkPath]: { not: null } })
                }
                if (constraintType === 'none' || constraintType === 'isNot') {
                    return remember({ [fkPath]: null })
                }
            }
            if (constraintType === 'is' || constraintType === 'some' || constraintType === 'every') {
                return remember(_idsToFilter(fkPath, relatedIds))
            }
            if (constraintType === 'none' || constraintType === 'isNot') {
                return remember(_idsToFilter(fkPath, relatedIds, { negate: true, includeNull: true }))
            }
            return remember(_idsToFilter(fkPath, relatedIds))
        }

        // Current list is "one" side, related list stores FK to current.id
        if (rel.cardinality === '1:N' && fieldAdapter && fieldAdapter.field && fieldAdapter.field.many) {
            const oppositePath = isCurrentOnLeft ? rel.right?.path : isCurrentOnRight ? rel.left?.path : null
            if (!oppositePath) return remember({ id: { in: [] } })
            const parentFkPath = _resolveRelationshipScalarPath(refListAdapter, oppositePath)
            const parentIdRows = await _findManyWithChunking(refListAdapter.key, refListAdapter.model, {
                where: relWhere || {},
                select: { [parentFkPath]: true },
                relationLoadStrategy: 'query',
            })
            const parentIds = _uniqueNonNull(parentIdRows.map(row => row[parentFkPath]))

            if (constraintType === 'is' || constraintType === 'some') {
                return remember(_idsToFilter('id', parentIds))
            }
            if (constraintType === 'none' || constraintType === 'isNot') {
                return remember(_idsToFilter('id', parentIds, { negate: true }))
            }
            if (constraintType === 'every') {
                // every(X) == not exists related where not X
                const notRows = await _findManyWithChunking(refListAdapter.key, refListAdapter.model, {
                    where: { NOT: relWhere || {} },
                    select: { [parentFkPath]: true },
                    relationLoadStrategy: 'query',
                })
                const notParentIds = _uniqueNonNull(notRows.map(row => row[parentFkPath]))
                return remember(_idsToFilter('id', notParentIds, { negate: true }))
            }
            return remember(_idsToFilter('id', parentIds))
        }

        // N:N through linking table (single-table read, no JOIN)
        if (rel.cardinality === 'N:N' && rel.tableName && rel.columnNames) {
            const key = `${rel.left.listKey}.${rel.left.path}`
            const columns = rel.columnNames[key]
            if (!columns) return remember({ id: { in: [] } })

            const isLeftSide = rel.left.listKey === this.key && rel.left.path === fieldAdapter.path
            const currentIdColumn = isLeftSide ? columns.near : columns.far
            const relatedIdColumn = isLeftSide ? columns.far : columns.near
            if (!currentIdColumn || !relatedIdColumn) return remember({ id: { in: [] } })
            if (relatedIds.length === 0) {
                return remember((constraintType === 'none' || constraintType === 'isNot' || constraintType === 'every')
                    ? {}
                    : { id: { in: [] } })
            }

            const schemaName = this.parentAdapter.dbSchemaName || 'public'
            const queryLinkRowsByIds = async ids => {
                const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(', ')
                const sql = `SELECT "${currentIdColumn}" AS "id" FROM "${schemaName}"."${rel.tableName}" WHERE "${relatedIdColumn}" IN (${placeholders})`
                return this.parentAdapter.prisma.$queryRawUnsafe(sql, ...ids)
            }
            const currentIdsSet = new Set()
            const idChunks = _chunkIds(relatedIds)
            await _runWithConcurrency(idChunks, CHUNK_QUERY_CONCURRENCY, async idsChunk => {
                const rowsPart = await queryLinkRowsByIds(idsChunk)
                for (const row of rowsPart) {
                    if (row && row.id !== null && row.id !== undefined) currentIdsSet.add(row.id)
                }
            })
            const currentIds = Array.from(currentIdsSet.values())

            if (constraintType === 'is' || constraintType === 'some') {
                return remember(_idsToFilter('id', currentIds))
            }
            if (constraintType === 'none' || constraintType === 'isNot') {
                return remember(_idsToFilter('id', currentIds, { negate: true }))
            }
            if (constraintType === 'every') {
                const notRelatedRows = await _findManyWithChunking(refListAdapter.key, refListAdapter.model, {
                    where: { NOT: relWhere || {} },
                    select: { id: true },
                    relationLoadStrategy: 'query',
                })
                const notRelatedIds = _uniqueNonNull(notRelatedRows.map(row => row.id))
                if (notRelatedIds.length === 0) return remember({})
                const disallowedIdsSet = new Set()
                await _runWithConcurrency(_chunkIds(notRelatedIds), CHUNK_QUERY_CONCURRENCY, async idsChunk => {
                    const rowsPart = await queryLinkRowsByIds(idsChunk)
                    for (const row of rowsPart) {
                        if (row && row.id !== null && row.id !== undefined) disallowedIdsSet.add(row.id)
                    }
                })
                return remember(_idsToFilter('id', Array.from(disallowedIdsSet.values()), { negate: true }))
            }
            return remember(_idsToFilter('id', currentIds))
        }

        return remember({ id: { in: [] } })
    }

    const processRelClause = async (fieldPath, clause) =>
        this.getListAdapterByKey(this.fieldAdaptersByPath[fieldPath].refListKey).processWheres(clause, sharedContext)

    const wheres = await Promise.all(Object.entries(where).map(async ([condition, value]) => {
        if (condition === 'AND' || condition === 'OR') {
            return { [condition]: await Promise.all(value.map(w => this.processWheres(w, sharedContext))) }
        } else if (
            this.fieldAdaptersByPath[condition] &&
            this.fieldAdaptersByPath[condition].isRelationship
        ) {
            const refListAdapter = this.getListAdapterByKey(this.fieldAdaptersByPath[condition].refListKey)
            const processedWhere = await refListAdapter.processWheres(value, sharedContext)
            return _filterByRelatedIdsThroughFk(this.fieldAdaptersByPath[condition], processedWhere, 'is')
        } else {
            let dbPath = condition
            let fieldAdapter = this.fieldAdaptersByPath[dbPath]
            while (!fieldAdapter && dbPath.includes('_')) {
                dbPath = dbPath.split('_').slice(0, -1).join('_')
                fieldAdapter = this.fieldAdaptersByPath[dbPath]
            }

            const supported = fieldAdapter && fieldAdapter.getQueryConditions(fieldAdapter.dbPath)[condition]
            if (supported) {
                return supported(value)
            } else if (fieldAdapter && condition.match(/_(gt|gte|lt|lte)$/)) {
                const match = condition.match(/_(gt|gte|lt|lte)$/)
                const op = match[1]
                const prismaOp = op === 'gt' ? 'gt' : op === 'gte' ? 'gte' : op === 'lt' ? 'lt' : 'lte'
                return { [dbPath]: { [prismaOp]: value } }
            } else {
                const [fieldPath, constraintType] = condition.split('_')
                const relationshipAdapter = this.fieldAdaptersByPath[fieldPath]
                if (relationshipAdapter && relationshipAdapter.isRelationship) {
                    const processedWhere = await processRelClause(fieldPath, value)
                    return _filterByRelatedIdsThroughFk(relationshipAdapter, processedWhere, constraintType)
                }
                return { [fieldPath]: { [constraintType]: await processRelClause(fieldPath, value) } }
            }
        }
    }))

    const result = wheres.length === 0 ? undefined : wheres.length === 1 ? wheres[0] : { AND: wheres }
    const sanitized = _sanitizeEmptyOrConditions(result)
    if (isRootCall) {
        _logAdapterPerf({
            list: this.key,
            phase: 'processWheres',
            elapsedMs: Date.now() - callStartedAt,
            relationFilterCacheSize: sharedContext.relationFilterCache.size,
            findManyCacheSize: sharedContext.findManyCache.size,
        })
    }
    return sanitized
}

function _resolveOrderByField (adapter, path) {
    if (!adapter) return path
    if (adapter.isRelationship) {
        const collisionFk = `${path}Fk`
        const standardFk = `${path}Id`
        const listAdapter = adapter.listAdapter
        if (listAdapter && listAdapter.fieldAdaptersByPath[collisionFk]) {
            return collisionFk
        }
        return standardFk
    }
    if (adapter.dbPath !== path) return adapter.dbPath
    return path
}

const _origPrismaFilter = PrismaListAdapter.prototype.prismaFilter
PrismaListAdapter.prototype.prismaFilter = async function (opts) {
    const result = await _origPrismaFilter.call(this, opts)
    if (result.where && typeof result.where.then === 'function') {
        result.where = await result.where
    }
    if (opts && opts.from && opts.from.fromId) {
        const { fromId, fromList, fromField } = opts.from
        const fromAdapter = fromList && fromList.adapter
        const fieldAdapter = fromAdapter && fromAdapter.fieldAdaptersByPath[fromField]
        if (fieldAdapter && fieldAdapter.rel) {
            const coercedId = this._coerceId(fromId, fromList.key)
            if (fieldAdapter.rel.cardinality === 'N:N') {
                const path = fieldAdapter.rel.right
                    ? fieldAdapter.field === fieldAdapter.rel.right
                        ? fieldAdapter.rel.left.path
                        : fieldAdapter.rel.right.path
                    : `from_${fieldAdapter.rel.left.listKey}_${fieldAdapter.rel.left.path}`
                result.where = {
                    ...(result.where || {}),
                    [path]: { some: { id: coercedId } },
                }
            } else if (fieldAdapter.rel.columnName) {
                result.where = {
                    ...(result.where || {}),
                    [fieldAdapter.rel.columnName]: { id: coercedId },
                }
            }
        }
    }
    if (result.orderBy && Array.isArray(result.orderBy)) {
        result.orderBy = result.orderBy.map(o => {
            if (!o || typeof o !== 'object') return o
            const [key] = Object.keys(o)
            const adapter = this.fieldAdaptersByPath[key]
            const resolved = _resolveOrderByField(adapter, key)
            return resolved !== key ? { [resolved]: o[key] } : o
        })
    } else if (result.orderBy && typeof result.orderBy === 'object') {
        result.orderBy = Object.entries(result.orderBy).map(([key, value]) => {
            const adapter = this.fieldAdaptersByPath[key]
            const resolved = _resolveOrderByField(adapter, key)
            return resolved !== key ? { [resolved]: value } : { [key]: value }
        })
    }
    return result
}

const _identity = x => x



const _origDecimalSetupHooks = _PrismaDecimalInterface.prototype.setupHooks
_PrismaDecimalInterface.prototype.setupHooks = function (hooks) {
    const knexOpts = this.config.knexOptions || {}
    if (this.config.precision === undefined && knexOpts.precision !== undefined) {
        this.precision = knexOpts.precision === null ? null : parseInt(knexOpts.precision) || 18
    }
    if (this.config.scale === undefined && knexOpts.scale !== undefined) {
        this.scale = knexOpts.scale === null ? null : parseInt(knexOpts.scale) || 4
    }
    return _origDecimalSetupHooks.call(this, hooks)
}

const _origDecimalGetPrismaSchema = _PrismaDecimalInterface.prototype.getPrismaSchema
_PrismaDecimalInterface.prototype.getPrismaSchema = function () {
    const knexOpts = this.config.knexOptions || {}
    if (this.config.precision === undefined && knexOpts.precision !== undefined) {
        this.precision = knexOpts.precision === null ? null : parseInt(knexOpts.precision) || 18
    }
    if (this.config.scale === undefined && knexOpts.scale !== undefined) {
        this.scale = knexOpts.scale === null ? null : parseInt(knexOpts.scale) || 4
    }
    return _origDecimalGetPrismaSchema.call(this)
}


_PrismaRelationshipInterface.prototype.getQueryConditions = function (dbPath) {
    return {
        [`${this.path}_is_null`]: value => (value ? { [dbPath]: { is: null } } : { [dbPath]: { isNot: null } }),
    }
}

const _isNonNullableField = (adapter) => !!(adapter.field && (adapter.field.isPrimaryKey || adapter.field.isRequired))

PrismaFieldAdapter.prototype.equalityConditions = function (dbPath, f = _identity) {
    return {
        [this.path]: value => {
            if (value == null) return _isNonNullableField(this) ? { id: { in: [] } } : { [dbPath]: null }
            return { [dbPath]: { equals: f(value) } }
        },
        [`${this.path}_not`]: value => {
            if (value == null) return _isNonNullableField(this) ? {} : { [dbPath]: { not: null } }
            return { NOT: { [dbPath]: { equals: f(value) } } }
        },
        [`${this.path}_is_null`]: value => {
            if (_isNonNullableField(this)) return value ? { id: { in: [] } } : {}
            return value ? { [dbPath]: null } : { [dbPath]: { not: null } }
        },
    }
}

PrismaFieldAdapter.prototype.equalityConditionsInsensitive = function (dbPath, f = _identity) {
    return {
        [`${this.path}_i`]: value => {
            if (value == null) return _isNonNullableField(this) ? { id: { in: [] } } : { [dbPath]: null }
            return { [dbPath]: { equals: f(value), mode: 'insensitive' } }
        },
        [`${this.path}_not_i`]: value => {
            if (value == null) return _isNonNullableField(this) ? {} : { [dbPath]: { not: null } }
            return { NOT: { [dbPath]: { equals: f(value), mode: 'insensitive' } } }
        },
    }
}

PrismaFieldAdapter.prototype.inConditions = function (dbPath, f = _identity) {
    return {
        [`${this.path}_in`]: value =>
            value.includes(null)
                ? { OR: [{ [dbPath]: { in: value.filter(x => x !== null).map(f) } }, { [dbPath]: null }] }
                : { [dbPath]: { in: value.map(f) } },
        [`${this.path}_not_in`]: value =>
            value.includes(null)
                ? {
                    AND: [
                        { NOT: { [dbPath]: { in: value.filter(x => x !== null).map(f) } } },
                        { [dbPath]: { not: null } },
                    ],
                }
                : { NOT: { [dbPath]: { in: value.map(f) } } },
    }
}

PrismaFieldAdapter.prototype.stringConditions = function (dbPath, f = _identity) {
    return {
        [`${this.path}_contains`]: value => value == null ? {} : ({ [dbPath]: { contains: f(value) } }),
        [`${this.path}_not_contains`]: value => value == null ? {} : ({ NOT: { [dbPath]: { contains: f(value) } } }),
        [`${this.path}_starts_with`]: value => value == null ? {} : ({ [dbPath]: { startsWith: f(value) } }),
        [`${this.path}_not_starts_with`]: value => value == null ? {} : ({ NOT: { [dbPath]: { startsWith: f(value) } } }),
        [`${this.path}_ends_with`]: value => value == null ? {} : ({ [dbPath]: { endsWith: f(value) } }),
        [`${this.path}_not_ends_with`]: value => value == null ? {} : ({ NOT: { [dbPath]: { endsWith: f(value) } } }),
    }
}

PrismaFieldAdapter.prototype.stringConditionsInsensitive = function (dbPath, f = _identity) {
    return {
        [`${this.path}_contains_i`]: value => value == null ? {} : ({
            [dbPath]: { contains: f(value), mode: 'insensitive' },
        }),
        [`${this.path}_not_contains_i`]: value => value == null ? {} : ({
            NOT: { [dbPath]: { contains: f(value), mode: 'insensitive' } },
        }),
        [`${this.path}_starts_with_i`]: value => value == null ? {} : ({
            [dbPath]: { startsWith: f(value), mode: 'insensitive' },
        }),
        [`${this.path}_not_starts_with_i`]: value => value == null ? {} : ({
            NOT: { [dbPath]: { startsWith: f(value), mode: 'insensitive' } },
        }),
        [`${this.path}_ends_with_i`]: value => value == null ? {} : ({
            [dbPath]: { endsWith: f(value), mode: 'insensitive' },
        }),
        [`${this.path}_not_ends_with_i`]: value => value == null ? {} : ({
            NOT: { [dbPath]: { endsWith: f(value), mode: 'insensitive' } },
        }),
    }
}

PrismaFieldAdapter.prototype.orderingConditions = function (dbPath, f = _identity) {
    return {
        [`${this.path}_gt`]: value => value == null ? {} : { [dbPath]: { gt: f(value) } },
        [`${this.path}_gte`]: value => value == null ? {} : { [dbPath]: { gte: f(value) } },
        [`${this.path}_lt`]: value => value == null ? {} : { [dbPath]: { lt: f(value) } },
        [`${this.path}_lte`]: value => value == null ? {} : { [dbPath]: { lte: f(value) } },
    }
}

// NOTE: Override getQueryConditions to include orderingConditions
// The base class doesn't include orderingConditions by default
PrismaFieldAdapter.prototype.getQueryConditions = function (dbPath) {
    return {
        ...this.equalityConditions(dbPath),
        ...this.equalityConditionsInsensitive(dbPath),
        ...this.inConditions(dbPath),
        ...this.stringConditions(dbPath),
        ...this.stringConditionsInsensitive(dbPath),
        ...this.orderingConditions(dbPath),
    }
}

// NOTE: Also patch specific field adapter classes that override getQueryConditions
const _patchFieldAdapter = (fieldAdapterClass) => {
    if (fieldAdapterClass && fieldAdapterClass.prototype && !fieldAdapterClass.prototype._patchedForOrdering) {
        fieldAdapterClass.prototype._patchedForOrdering = true
        const original = fieldAdapterClass.prototype.getQueryConditions
        fieldAdapterClass.prototype.getQueryConditions = function (dbPath) {
            const conditions = original.call(this, dbPath)
            // Add ordering conditions if not present
            const ordering = this.orderingConditions(dbPath)
            for (const [key, handler] of Object.entries(ordering)) {
                if (!(key in conditions)) {
                    conditions[key] = handler
                }
            }
            return conditions
        }
    }
}

// Patch field adapters synchronously
try {
    const fields = require('@open-keystone/fields')

    // Patch all field types that have Prisma adapters
    const fieldTypes = ['Text', 'DateTimeUtc', 'Integer', 'Decimal', 'Checkbox', 'Float', 'Json', 'Select', 'CalendarDay', 'Password', 'File']

    for (const fieldType of fieldTypes) {
        if (fields[fieldType] && fields[fieldType].adapters && fields[fieldType].adapters.prisma) {
            _patchFieldAdapter(fields[fieldType].adapters.prisma)
        }
    }

    // Also patch any other exported adapters
    for (const [name, FieldType] of Object.entries(fields)) {
        if (FieldType && FieldType.adapters && FieldType.adapters.prisma && !FieldType.adapters.prisma.prototype._patchedForOrdering) {
            _patchFieldAdapter(FieldType.adapters.prisma)
        }
    }
} catch (e) {
    logger.error({
        msg: 'Failed to patch Prisma field adapters',
        err: e,
    })
}


function _addFieldToKnexSchema (fa, table, knex) {
    const path = fa.path
    const fieldName = fa.fieldName
    const cfg = fa.config || {}
    const knexOptions = cfg.knexOptions || {}

    const isUnique = fa.isUnique !== undefined ? !!fa.isUnique : !!cfg.isUnique
    const isIndexed = fa.isIndexed !== undefined ? !!fa.isIndexed : !!cfg.isIndexed

    let isNotNullable = false
    if (typeof knexOptions.isNotNullable !== 'undefined') {
        isNotNullable = false
    } else if (fa.field.isRequired) {
        isNotNullable = true
    } else if (typeof fa.field.defaultValue === 'function') {
        isNotNullable = false
    } else {
        isNotNullable = typeof fa.field.defaultValue !== 'undefined' && fa.field.defaultValue !== null
    }


    const defaultToRaw = knexOptions.defaultTo
    const defaultTo = typeof defaultToRaw === 'function' ? defaultToRaw(knex) : defaultToRaw

    if (fa.isRelationship) {
        if (fa.field.many) return // N:N — no column in this table
        if (fa.rel) {
            const { right, cardinality } = fa.rel
            if (cardinality === '1:1' && right && right.adapter === fa) return
        }

        const refListAdapter = fa.listAdapter.parentAdapter.getListAdapterByKey(fa.refListKey)
        if (!refListAdapter) return
        const refPkAdapter = refListAdapter.getPrimaryKeyAdapter()
        const pkFieldName = refPkAdapter ? refPkAdapter.fieldName : 'Uuid'
        let column
        if (pkFieldName === 'AutoIncrementInteger' || pkFieldName === 'Integer') {
            column = table.integer(path)
        } else {
            column = table.uuid(path)
        }
        if (isUnique) column.unique()
        else if (isIndexed) column.index()
        if (knexOptions.isNotNullable) column.notNullable()
        if (cfg.kmigratorOptions) table.kmigrator(path, cfg.kmigratorOptions)
        return
    }

    if (fieldName === 'HiddenRelationshipImplementation') {
        const [refListKey] = (cfg.ref || '').split('.')
        const refListAdapter = refListKey && fa.listAdapter.parentAdapter.getListAdapterByKey(refListKey)
        if (refListAdapter) {
            const refPkAdapter = refListAdapter.getPrimaryKeyAdapter()
            const pkFieldName = refPkAdapter ? refPkAdapter.fieldName : 'Uuid'
            let column
            if (pkFieldName === 'AutoIncrementInteger' || pkFieldName === 'Integer') {
                column = table.integer(path)
            } else {
                column = table.uuid(path)
            }
            if (isUnique) column.unique()
            else if (isIndexed) column.index()
            if (isNotNullable) column.notNullable()
            if (cfg.kmigratorOptions) table.kmigrator(path, cfg.kmigratorOptions)
            return
        }
        // Fallback to text if ref not found
    }


    let column
    switch (fieldName) {
        case 'Uuid':
        case 'UuidImplementation':
            column = table.uuid(path)
            if (fa.field.isPrimaryKey || path === 'id') {
                column.primary().notNullable()
                return
            }
            break
        case 'AutoIncrementInteger':
            if (fa.field.isPrimaryKey || path === 'id') {
                table.increments(path)
                return
            }
            column = table.integer(path)
            break
        case 'Text':
        case 'DateInterval':
        case 'EncryptedText':
        case 'EncryptedTextImplementation':
        case 'LocalizedText':
        case 'Slug':
        case 'WysiwygImplementation':
            column = table.text(path)
            break
        case 'Integer':
            column = table.integer(path)
            break
        case 'Checkbox':
            column = table.boolean(path)
            break
        case 'Float':
            column = table.float(path)
            break
        case 'Decimal':
        case 'SignedDecimal': {
            const decPrecision = knexOptions.precision || 18
            const decScale = knexOptions.scale || 4
            column = table.decimal(path, decPrecision, decScale)
            break
        }
        case 'DateTimeUtc':
        case 'DateTimeUtcImplementation':
            column = table.timestamp(path, { useTz: true, precision: 3 })
            break
        case 'DateTime': {
            const utcPath = (fa.utcPath || fa.field.utcPath || path + '_utc')
            const offsetPath = (fa.offsetPath || fa.field.offsetPath || path + '_offset')
            const utcCol = table.timestamp(utcPath, { useTz: false })
            const offCol = table.text(offsetPath)
            if (fa.isUnique) table.unique([utcPath, offsetPath])
            else if (fa.isIndexed) table.index([utcPath, offsetPath])
            if (fa.isNotNullable) {
                utcCol.notNullable()
                offCol.notNullable()
            }
            if (cfg.kmigratorOptions) table.kmigrator(utcPath, cfg.kmigratorOptions)
            return // DateTime handles its own unique/index/notNullable
        }
        case 'CalendarDay':
            column = table.date(path)
            break
        case 'Select':
        case 'Options':
            if (fa.field.dataType === 'enum') {
                column = table.enu(path, (fa.field.options || []).map(o => o.value))
            } else if (fa.field.dataType === 'integer') {
                column = table.integer(path)
            } else {
                column = table.text(path)
            }
            break
        case 'Password':
            column = table.string(path, 60)
            break
        case 'File':
        case 'FileWithUTF8Name':
        case 'CustomFile':
            column = table.jsonb(path)
            break
        case 'Json':
        case 'JsonImplementation':
        case 'AddressPartWithType':
        case 'AddressPartWithTypeImplementation':
            column = table.jsonb(path)
            break
        case 'Virtual':
            return // No column
        default:
            column = table.text(path)
            break
    }

    if (column) {
        if (isUnique) column.unique()
        else if (isIndexed) column.index()
        if (isNotNullable) column.notNullable()
        if (typeof defaultTo !== 'undefined') column.defaultTo(defaultTo)
        if (cfg.kmigratorOptions) table.kmigrator(path, cfg.kmigratorOptions)
    }
}

class PrismaAdapter extends OriginalPrismaAdapter {
    constructor () {
        super(...arguments)

        this.relationLoadStrategy = this.config.relationLoadStrategy || 'query'

        // NOTE: Disable migrations by default - we use external (Django/Python) migrations
        this.migrationMode = this.config.migrationMode || 'none'

        // NOTE: Enable verbose query logging if explicitly configured or via env variable
        this.enableLogging = this.config.enableLogging || process.env.KEYSTONE_ENABLE_LOGGING === 'true'
    }

    __kmigratorKnexAdapters () {
        const url = this._url()
        const knexInstance = require('knex')({
            client: 'pg',
            connection: url,
        })

        const schemaName = this.getDbSchemaName ? this.getDbSchemaName() : 'public'

        const allRels = []
        const relSet = new Set()
        for (const la of Object.values(this.listAdapters)) {
            for (const fa of la.fieldAdapters) {
                if (fa.rel && !relSet.has(fa.rel)) {
                    relSet.add(fa.rel)
                    allRels.push(fa.rel)
                }
            }
        }

        const getListAdapterByKey = (key) => this.getListAdapterByKey(key)
        const listAdapters = this.listAdapters

        const adapter = {
            knex: knexInstance,
            schemaName,
            schema () {
                return knexInstance.schema.withSchema(this.schemaName)
            },
            getListAdapterByKey,
            async _createTables () {
                const results = []

                for (const la of Object.values(listAdapters)) {
                    try {
                        await adapter.schema().createTable(la.key, (table) => {
                            for (const fa of la.fieldAdapters) {
                                _addFieldToKnexSchema(fa, table, knexInstance)
                            }
                        })
                        results.push({ isFulfilled: true })
                    } catch (err) {
                        results.push({ isRejected: true, reason: err })
                    }
                }

                for (const rel of allRels) {
                    const { left, right, cardinality, tableName } = rel
                    try {
                        if (cardinality === 'N:N') {
                            const columnKey = `${left.listKey}.${left.path}`
                            const { near, far } = rel.columnNames[columnKey]
                            const leftListAdapter = getListAdapterByKey(left.listKey)
                            const rightListAdapter = getListAdapterByKey(left.adapter.refListKey)
                            const leftPkName = leftListAdapter.getPrimaryKeyAdapter().fieldName
                            const rightPkName = rightListAdapter.getPrimaryKeyAdapter().fieldName

                            await adapter.schema().createTable(tableName, (table) => {
                                const leftCol = (leftPkName === 'AutoIncrementInteger' || leftPkName === 'Integer')
                                    ? table.integer(near) : table.uuid(near)
                                leftCol.index().notNullable()
                                table.foreign(near).references('id').inTable(`${schemaName}.${left.listKey}`)

                                const rightCol = (rightPkName === 'AutoIncrementInteger' || rightPkName === 'Integer')
                                    ? table.integer(far) : table.uuid(far)
                                rightCol.index().notNullable()
                                table.foreign(far).references('id').inTable(`${schemaName}.${left.adapter.refListKey}`)
                            })
                        } else if (cardinality === '1:N' && right) {
                            await adapter.schema().table(right.listKey, (table) => {
                                table.foreign(right.path).references('id')
                                    .inTable(`${schemaName}.${left.listKey}`)
                            })
                        } else if (cardinality === 'N:1') {
                            await adapter.schema().table(left.listKey, (table) => {
                                table.foreign(left.path).references('id')
                                    .inTable(`${schemaName}.${left.adapter.refListKey}`)
                            })
                        } else if (cardinality === '1:1') {
                            await adapter.schema().table(left.listKey, (table) => {
                                table.foreign(left.path).references('id')
                                    .inTable(`${schemaName}.${left.adapter.refListKey}`)
                            })
                        }
                    } catch (err) {
                        results.push({ isRejected: true, reason: err })
                    }
                }

                return results
            },
        }

        return [adapter]
    }

    async _generatePrismaSchema ({ rels, clientDir }) {
        let schema = await super._generatePrismaSchema({ rels, clientDir })
        if (this.relationLoadStrategy === 'query') {
            schema = schema.replace(
                'provider = "prisma-client-js"',
                'provider        = "prisma-client-js"\n  previewFeatures = ["relationJoins"]'
            )
        }

        schema = this._fixGeneratedPrismaSchema(schema)
        return schema
    }

    _fixGeneratedPrismaSchema (schema) {
        const modelPkTypes = {}
        const pkRegex = /model\s+(\w+)\s*\{[\s\S]*?\n\s*\}/g // NOSONAR
        let m
        while ((m = pkRegex.exec(schema)) !== null) {
            const modelName = m[1]
            const body = m[0]
            const idMatch = body.match(/\bid\s+(\w+)\s+@id/)
            if (idMatch) {
                modelPkTypes[modelName] = idMatch[1]
            }
        }

        return schema.replace(/model\s+(\w+)\s*\{([\s\S]*?)\n\s*\}/g, (modelBlock, modelName, modelBody) => { // NOSONAR
            const lines = modelBody.split('\n')

            const fkToRefModel = {}
            for (const line of lines) {
                const relMatch = line.match(/(\w+)\s+(\w+)\??\s+@relation\([^)]*fields:\s*\[(\w+)\]/) // NOSONAR
                if (relMatch) {
                    fkToRefModel[relMatch[3]] = relMatch[2]
                }
            }
            if (Object.keys(fkToRefModel).length === 0) return modelBlock

            const scalarFieldNames = new Set()
            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed || trimmed.startsWith('@@')) continue
                const fieldMatch = trimmed.match(/^(\w+)\s+\w/)
                if (fieldMatch && !line.includes('@relation') && !line.includes('@map')) {
                    scalarFieldNames.add(fieldMatch[1])
                }
            }

            let result = modelBlock
            for (const [fkName, refModel] of Object.entries(fkToRefModel)) {
                const expectedType = modelPkTypes[refModel] || 'String'
                if (expectedType !== 'Int') {
                    result = result.replace(
                        // Not a ReDoS case. We generate a specific RE from controlled input
                        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                        new RegExp('(\\b' + fkName + '\\s+)Int(\\??\\s+@map)'),
                        '$1' + expectedType + '$2'
                    )
                }

                if (scalarFieldNames.has(fkName)) {
                    const newFkName = fkName.replace(/Id$/, 'Fk')
                    if (newFkName === fkName) continue

                    result = result.replace(
                        // Not a ReDoS case. We generate a specific RE from controlled input
                        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                        new RegExp('fields:\\s*\\[' + fkName + '\\]'),
                        'fields: [' + newFkName + ']'
                    )
                    result = result.replace(
                        // Not a ReDoS case. We generate a specific RE from controlled input
                        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                        new RegExp('(\\s+)' + fkName + '(\\s+\\w+\\??\\s+@map)', 'm'),
                        '$1' + newFkName + '$2'
                    )
                }
            }
            return result
        })
    }


    async _generateClient (rels) {
        const clientDir = 'generated-client'

        const prismaSchema = await this._generatePrismaSchema({ rels, clientDir })

        const prismaPath = this.getPrismaPath({ prismaSchema })
        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        this.schemaPath = path.join(prismaPath, 'schema.prisma')
        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        this.clientPath = path.resolve(`${prismaPath}/${clientDir}`)
        this.dbSchemaName = this.getDbSchemaName({ prismaSchema })

        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        const hashFile = path.join(prismaPath, '.schema-hash')
        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        const clientIndexFile = path.join(this.clientPath, 'index.js')
        const newHash = crypto.createHash('sha256').update(prismaSchema).digest('hex')

        try {
            if (fs.existsSync(clientIndexFile)) {
                const existingHash = fs.readFileSync(hashFile, 'utf-8').trim()
                if (existingHash === newHash) {
                    return // Client already generated with same schema — skip expensive steps
                }
            }
        } catch (e) {
            // hash file doesn't exist or unreadable — proceed with full generation
        }

        fs.mkdirSync(path.dirname(this.schemaPath), { recursive: true })
        fs.writeFileSync(this.schemaPath, prismaSchema)
        this._runPrismaCmd('format')

        const formattedSchema = fs.readFileSync(this.schemaPath, { encoding: 'utf-8' })
        await this._writePrismaSchema({ prismaSchema: formattedSchema })
        await this._generatePrismaClient()
        await this._runMigrations()

        fs.writeFileSync(hashFile, newHash)
    }

    async _connect ({ rels }) {
        await this._generateClient(rels)
        const { PrismaClient, Prisma } = require(this.clientPath)
        const { extractShardingKeysFromWhere, injectShardingKeyIntoArgs, getShardingKeyFields } = require('../sharding')

        const prismaOptions = {
            datasources: { [this.provider]: { url: this._url() } },
        }

        if (this.enableLogging) {
            prismaOptions.log = ['query']
        }

        let prisma = new PrismaClient(prismaOptions)
        prisma.DbNull = Prisma.DbNull

        const prismaRef = { current: null }

        const applyShardingKeys = (model, args) => {
            const shardingFields = getShardingKeyFields(model)
            if (shardingFields.length > 0) {
                extractShardingKeysFromWhere(model, args.where)
                injectShardingKeyIntoArgs(model, args)
            }
        }

        const applyQueryStrategy = (args) => {
            args.relationLoadStrategy = 'query'
        }

        const handleMutationWithInclude = async (args, query, model, prismaRef) => {
            const include = args.include
            if (!include) return query(args)

            delete args.include
            const result = await query(args)
            const modelName = model.charAt(0).toLowerCase() + model.slice(1)
            return prismaRef.current[modelName].findUnique({
                where: { id: result.id },
                include,
            })
        }

        prisma = prisma.$extends({
            query: {
                $allModels: {
                    async create ({ args, query, model }) {
                        return handleMutationWithInclude(args, query, model, prismaRef)
                    },
                    async update ({ args, query, model }) {
                        return handleMutationWithInclude(args, query, model, prismaRef)
                    },
                    async findMany ({ args, query, model }) {
                        applyQueryStrategy(args)
                        applyShardingKeys(model, args)
                        return query(args)
                    },
                    async findFirst ({ args, query, model }) {
                        applyQueryStrategy(args)
                        applyShardingKeys(model, args)
                        return query(args)
                    },
                    async findUnique ({ args, query, model }) {
                        applyQueryStrategy(args)
                        applyShardingKeys(model, args)
                        return query(args)
                    },
                    async count ({ args, query, model }) {
                        applyQueryStrategy(args)
                        applyShardingKeys(model, args)
                        return query(args)
                    },
                    async aggregate ({ args, query, model }) {
                        applyQueryStrategy(args)
                        applyShardingKeys(model, args)
                        return query(args)
                    },
                    async groupBy ({ args, query, model }) {
                        applyQueryStrategy(args)
                        applyShardingKeys(model, args)
                        return query(args)
                    },
                },
            },
        })

        prismaRef.current = prisma
        this.prisma = prisma
        await this.prisma.$connect()

        if (this.enableLogging) {
            prisma.$on('query', (e) => {
                logger.info({
                    msg: 'Prisma query executed',
                    data: {
                        query: e.query,
                        params: e.params,
                        duration: `${e.duration}ms`,
                    },
                })
            })
        }
    }

}

module.exports = { PrismaAdapter }
