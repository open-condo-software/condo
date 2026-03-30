const { PrismaAdapter: OriginalPrismaAdapter } = require('@open-keystone/adapter-prisma')

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

    // Replicate KnexFieldAdapter's isNotNullable getter:
    // 1. Check knexOptions.isNotNullable explicitly
    // 2. Fallback to field.isRequired
    // 3. Fallback to checking field.defaultValue is set and non-null
    let isNotNullable = false
    if (fa.isNotNullable !== undefined) {
        isNotNullable = !!fa.isNotNullable
    } else if (typeof knexOptions.isNotNullable !== 'undefined') {
        isNotNullable = !!knexOptions.isNotNullable
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

        const adapter = {
            knex: knexInstance,
            schemaName,
            schema () {
                return knexInstance.schema.withSchema(this.schemaName)
            },
            getListAdapterByKey: (key) => this.getListAdapterByKey(key),
            async _createTables () {
                const results = []

                for (const la of Object.values(this.listAdapters)) {
                    try {
                        await this.schema().createTable(la.key, (table) => {
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
                            const leftListAdapter = adapter.getListAdapterByKey(left.listKey)
                            const rightListAdapter = adapter.getListAdapterByKey(left.adapter.refListKey)
                            const leftPkName = leftListAdapter.getPrimaryKeyAdapter().fieldName
                            const rightPkName = rightListAdapter.getPrimaryKeyAdapter().fieldName

                            await this.schema().createTable(tableName, (table) => {
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
                            await this.schema().table(right.listKey, (table) => {
                                table.foreign(right.path).references('id')
                                    .inTable(`${schemaName}.${left.listKey}`)
                            })
                        } else if (cardinality === 'N:1') {
                            await this.schema().table(left.listKey, (table) => {
                                table.foreign(left.path).references('id')
                                    .inTable(`${schemaName}.${left.adapter.refListKey}`)
                            })
                        } else if (cardinality === '1:1') {
                            await this.schema().table(left.listKey, (table) => {
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
        return schema
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
