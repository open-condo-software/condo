const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const { PrismaAdapter: OriginalPrismaAdapter, PrismaListAdapter, PrismaFieldAdapter } = require('@open-keystone/adapter-prisma')
const { defaultObj, mapKeys } = require('@open-keystone/utils')

// NOTE: Utility to recursively strip undefined values from objects.
// Prisma rejects objects with undefined values in filters.
function cleanUndefinedValues (obj) {
    if (obj === undefined) return undefined
    if (obj === null) return null
    if (obj instanceof Date) return obj
    if (Array.isArray(obj)) {
        const cleaned = obj.map(item => cleanUndefinedValues(item)).filter(item => item !== undefined)
        return cleaned
    }
    if (typeof obj === 'object') {
        const proto = Object.getPrototypeOf(obj)
        if (proto !== Object.prototype && proto !== null) return obj
        const cleaned = {}
        for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = cleanUndefinedValues(value)
            if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue
            }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined
    }
    return obj
}

// NOTE: Monkey-patch PrismaListAdapter to fix runtime FK handling.
// The published @open-keystone/adapter-prisma@4.0.20 hardcodes Number() for all FK values
// and doesn't handle UUID PKs, null values, or FK field name mapping.
// These overrides implement the fixes from the patched adapter version.

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

    const _origItemsQuery = PrismaListAdapter.prototype._itemsQuery
    PrismaListAdapter.prototype._itemsQuery = async function (args, opts = {}) {
        const { meta = false, from = {} } = opts
        const rawFilter = await this.prismaFilter({ args, meta, from })
        const filter = cleanUndefinedValues(rawFilter) || {}
        if (meta) {
            let count = await this.model.count(filter)
            const { first, skip } = args
            if (skip !== undefined) count -= skip
            if (first !== undefined) count = Math.min(count, first)
            count = Math.max(0, count)
            return { count }
        } else {
            return this.model.findMany(filter).then(items => items.map(item => this._mapResultItem(item)))
        }
    }

    const _origPrismaFilter = PrismaListAdapter.prototype.prismaFilter
    PrismaListAdapter.prototype.prismaFilter = async function ({ args: { where = {}, first, skip, sortBy, orderBy, search }, meta, from }) {
        const ret = {}
        const allWheres = await this.processWheres(where)
        if (allWheres) ret.where = allWheres
        if (from.fromId) {
            if (!ret.where) ret.where = {}
            const a = from.fromList.adapter.fieldAdaptersByPath[from.fromField]
            const coercedFromId = this._coerceId(from.fromId, from.fromList.key)
            if (a.rel.cardinality === 'N:N') {
                const path = a.rel.right
                    ? a.field === a.rel.right ? a.rel.left.path : a.rel.right.path
                    : `from_${a.rel.left.listKey}_${a.rel.left.path}`
                ret.where[path] = { some: { id: coercedFromId } }
            } else {
                ret.where[a.rel.columnName] = { id: coercedFromId }
            }
        }
        const searchFieldName = this.config.searchField || 'name'
        const searchField = this.fieldAdaptersByPath[searchFieldName]
        if (search !== undefined && search !== null && search !== '' && searchField) {
            if (searchField.fieldName === 'Text') {
                if (!ret.where) {
                    ret.where = { [searchFieldName]: { contains: search, mode: 'insensitive' } }
                } else {
                    ret.where = { AND: [ret.where, { [searchFieldName]: { contains: search, mode: 'insensitive' } }] }
                }
            }
        }
        if (!meta) {
            if (first !== undefined) ret.take = first
            if (skip !== undefined) ret.skip = skip
            if (orderBy) {
                if (typeof orderBy === 'string' || (Array.isArray(orderBy) && typeof orderBy[0] === 'string')) {
                    const sortByArr = Array.isArray(orderBy) ? orderBy : [orderBy]
                    ret.orderBy = sortByArr.map(s => {
                        const _sort = s.split('_')
                        const order = _sort.pop().toLowerCase()
                        const sortPath = _sort.join('_')
                        const adapter = this.fieldAdaptersByPath[sortPath]
                        if (adapter && adapter.dbPath !== sortPath) {
                            return { [adapter.dbPath]: order }
                        }
                        return { [sortPath]: order }
                    })
                } else {
                    const orderByArr = Array.isArray(orderBy) ? orderBy : [orderBy]
                    ret.orderBy = orderByArr.map(o => {
                        const [key] = Object.keys(o)
                        const adapter = this.fieldAdaptersByPath[key]
                        if (adapter && adapter.dbPath !== key) {
                            return { [adapter.dbPath]: o[key] }
                        }
                        return o
                    })
                }
            } else if (sortBy) {
                ret.orderBy = sortBy.map(s => {
                    const _sort = s.split('_')
                    const order = _sort.pop().toLowerCase()
                    const path = _sort.join('_')
                    const adapter = this.fieldAdaptersByPath[path]
                    if (adapter && adapter.dbPath !== path) {
                        return { [adapter.dbPath]: order }
                    }
                    return { [path]: order }
                })
            }
            const include = this._include()
            if (include) ret.include = include
        }
        return ret
    }
}

const _identity = x => x

PrismaFieldAdapter.prototype.equalityConditions = function (dbPath, f = _identity) {
    return {
        [this.path]: value => ({ [dbPath]: { equals: f(value) } }),
        [`${this.path}_not`]: value => ({ NOT: { [dbPath]: { equals: f(value) } } }),
    }
}

PrismaFieldAdapter.prototype.equalityConditionsInsensitive = function (dbPath, f = _identity) {
    return {
        [`${this.path}_i`]: value => ({ [dbPath]: { equals: f(value), mode: 'insensitive' } }),
        [`${this.path}_not_i`]: value => ({ NOT: { [dbPath]: { equals: f(value), mode: 'insensitive' } } }),
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
                        { NOT: { [dbPath]: null } },
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

// Maps PrismaFieldAdapter info to Knex table builder calls for kmigrator schema extraction.
// This replicates what the Knex field adapters' addToTableSchema() methods do.
function _addFieldToKnexSchema (fa, table, knex) {
    const path = fa.path
    const fieldName = fa.fieldName
    const cfg = fa.config || {}
    const knexOptions = cfg.knexOptions || {}

    // Replicate KnexFieldAdapter's isUnique/isIndexed from config
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

    // Replicate KnexFieldAdapter's defaultTo getter from knexOptions
    // If defaultTo is a function, call it with knex instance to resolve the value
    const defaultToRaw = knexOptions.defaultTo
    const defaultTo = typeof defaultToRaw === 'function' ? defaultToRaw(knex) : defaultToRaw

    // Relationship fields: create FK column based on cardinality
    // NOTE: fieldName is this.constructor.name from Implementation class, e.g.
    // 'Relationship', 'AuthedRelationship', 'HiddenRelationshipImplementation'
    if (fa.isRelationship) {
        if (fa.field.many) return // N:N — no column in this table
        if (fa.rel) {
            const { right, cardinality } = fa.rel
            // 1:1 right side — FK is on the left side only
            if (cardinality === '1:1' && right && right.adapter === fa) return
        }
        // Determine FK column type from referenced model's PK
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
        // FK fields default to nullable (matching Knex adapter's KnexRelationshipInterface)
        // Only knexOptions.isNotNullable can make them NOT NULL, not isRequired
        if (knexOptions.isNotNullable) column.notNullable()
        if (cfg.kmigratorOptions) table.kmigrator(path, cfg.kmigratorOptions)
        return
    }

    // HiddenRelationship: uses Text.adapters.prisma (fa.isRelationship=false) but
    // the Knex adapter (HiddenKnexRelationshipInterface) creates UUID FK columns.
    // Replicate that behavior here.
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

    // Scalar fields
    // NOTE: fieldName is this.constructor.name from the Implementation class.
    // Names include full class names like 'UuidImplementation', 'DateTimeUtcImplementation', etc.
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
            // Use knexOptions for precision/scale (matching KnexDecimalInterface defaults)
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
            // Fallback: most custom types extending Text use text columns
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
        // NOTE: Disable JOINs globally by default.
        // Prisma 6+ uses JOINs (lateral joins) by default for relation queries.
        // Setting relationLoadStrategy to 'query' forces Prisma to use separate queries
        // instead of JOINs. This is critical for cross-database table splitting where
        // related tables may reside in different databases.
        this.relationLoadStrategy = this.config.relationLoadStrategy || 'query'

        // NOTE: Disable migrations by default - we use external (Django/Python) migrations
        this.migrationMode = this.config.migrationMode || 'none'

        // NOTE: Enable verbose query logging if explicitly configured or via env variable
        this.enableLogging = this.config.enableLogging || process.env.KEYSTONE_ENABLE_LOGGING === 'true'
    }

    // NOTE: Provides a Knex-compatible interface for kmigrator (bin/kmigrator.py).
    // The kmigrator uses Knex for schema extraction and migration execution.
    // This method creates a temporary Knex connection and implements _createTables()
    // that maps PrismaFieldAdapter types to Knex table builder calls.
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

                // 2. Create N:N adjacency tables and FK constraints
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
                                // Left FK column
                                const leftCol = (leftPkName === 'AutoIncrementInteger' || leftPkName === 'Integer')
                                    ? table.integer(near) : table.uuid(near)
                                leftCol.index().notNullable()
                                table.foreign(near).references('id').inTable(`${schemaName}.${left.listKey}`)

                                // Right FK column
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

    // NOTE: Override schema generation to inject previewFeatures = ["relationJoins"]
    // into the generator block. Even though Prisma 6 claims relationJoins is GA,
    // the generated client still requires this preview feature flag to recognize
    // the relationLoadStrategy query argument.
    async _generatePrismaSchema ({ rels, clientDir }) {
        let schema = await super._generatePrismaSchema({ rels, clientDir })
        if (this.relationLoadStrategy === 'query') {
            schema = schema.replace(
                'provider = "prisma-client-js"',
                'provider        = "prisma-client-js"\n  previewFeatures = ["relationJoins"]'
            )
        }
        // NOTE: Fix issues in the Prisma schema generated by the published adapter:
        // 1. FK type mismatch: published adapter hardcodes Int? for FK fields, but models use UUID PKs (String)
        // 2. FK name collision: when a model has both a Relationship (e.g. "organization") and a scalar
        //    field "organizationId", both generate "organizationId" in Prisma — fix by renaming FK to pathFk
        schema = this._fixGeneratedPrismaSchema(schema)
        return schema
    }

    _fixGeneratedPrismaSchema (schema) {
        // Pass 1: Build map of model name → PK type from @id annotations
        const modelPkTypes = {}
        const pkRegex = /model\s+(\w+)\s*\{[\s\S]*?\n\s*\}/g
        let m
        while ((m = pkRegex.exec(schema)) !== null) {
            const modelName = m[1]
            const body = m[0]
            const idMatch = body.match(/\bid\s+(\w+)\s+@id/)
            if (idMatch) {
                modelPkTypes[modelName] = idMatch[1]
            }
        }

        // Pass 2: Fix each model block
        return schema.replace(/model\s+(\w+)\s*\{([\s\S]*?)\n\s*\}/g, (modelBlock, modelName, modelBody) => {
            const lines = modelBody.split('\n')

            // Collect relations: FK field name → referenced model name
            const fkToRefModel = {}
            for (const line of lines) {
                const relMatch = line.match(/(\w+)\s+(\w+)\??\s+@relation\([^)]*fields:\s*\[(\w+)\]/)
                if (relMatch) {
                    fkToRefModel[relMatch[3]] = relMatch[2]
                }
            }
            if (Object.keys(fkToRefModel).length === 0) return modelBlock

            // Collect scalar field names (non-relation, non-FK-with-@map)
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
                // Fix 1: FK type — replace Int? with the referenced model's PK type
                const expectedType = modelPkTypes[refModel] || 'String'
                if (expectedType !== 'Int') {
                    result = result.replace(
                        new RegExp('(\\b' + fkName + '\\s+)Int(\\??\\s+@map)'),
                        '$1' + expectedType + '$2'
                    )
                }

                // Fix 2: FK name collision — if scalar field with same name exists, rename FK to pathFk
                if (scalarFieldNames.has(fkName)) {
                    const newFkName = fkName.replace(/Id$/, 'Fk')
                    if (newFkName === fkName) continue

                    result = result.replace(
                        new RegExp('fields:\\s*\\[' + fkName + '\\]'),
                        'fields: [' + newFkName + ']'
                    )
                    result = result.replace(
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
        this.schemaPath = path.join(prismaPath, 'schema.prisma')
        this.clientPath = path.resolve(`${prismaPath}/${clientDir}`)
        this.dbSchemaName = this.getDbSchemaName({ prismaSchema })

        const hashFile = path.join(prismaPath, '.schema-hash')
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
                console.log('prisma:query', { query: e.query, params: e.params, duration: `${e.duration}ms` })
            })
        }
    }

}

module.exports = { PrismaAdapter }
