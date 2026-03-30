const get = require('lodash/get')
const omit = require('lodash/omit')

const conf = require('@open-condo/config')
const { graphqlCtx } = require('@open-condo/keystone/KSv5v6/utils/graphqlCtx')
const { getLogger } = require('@open-condo/keystone/logging')


const { PrismaPool } = require('./pool')

const { getNamedDBs, getReplicaPoolsConfig, getQueryRoutingRules, isDefaultRule } = require('../BalancingReplicaKnexAdapter/utils/env')
const { isRuleMatching } = require('../BalancingReplicaKnexAdapter/utils/rules')
const { PrismaAdapter } = require('../PrismaAdapter')

const logger = getLogger('balancing-prisma-adapter')

// Maps Prisma model operations to SQL operation names for routing rule matching
const PRISMA_OP_TO_SQL = {
    findMany: 'select',
    findFirst: 'select',
    findUnique: 'select',
    findFirstOrThrow: 'select',
    findUniqueOrThrow: 'select',
    count: 'select',
    aggregate: 'select',
    groupBy: 'select',
    create: 'insert',
    createMany: 'insert',
    createManyAndReturn: 'insert',
    update: 'update',
    updateMany: 'update',
    upsert: 'update',
    delete: 'delete',
    deleteMany: 'delete',
}

/**
 * A Prisma-based database adapter that routes queries to multiple databases
 * based on configurable routing rules and load balancing.
 *
 * Config format is identical to BalancingReplicaKnexAdapter:
 * - DATABASE_URL: 'custom:{"main": "postgresql://...", "replica": "postgresql://..."}'
 * - DATABASE_POOLS: '{"primary": {"databases": ["main"], "writable": true, ...}, "readonly": {"databases": ["replica"], "writable": false, ...}}'
 * - DATABASE_ROUTING_RULES: '[{"sqlOperationName": "select", "target": "readonly"}, {"target": "primary"}]'
 *
 * Use DATABASE_URL prefix 'prisma-custom:' to activate this adapter (configured in setup.utils.js)
 */
class BalancingReplicaPrismaAdapter extends PrismaAdapter {
    constructor ({ databaseUrl, replicaPools, routingRules }) {
        // NOTE: Pass a dummy URL to parent - we'll override _connect entirely.
        // The parent PrismaAdapter needs a URL for schema generation, so we extract the first DB URL.
        const dbConnections = getNamedDBs(databaseUrl || conf['DATABASE_URL'])
        const firstUrl = Object.values(dbConnections)[0]
        super({ url: firstUrl, migrationMode: 'none', relationLoadStrategy: 'query' })

        this._dbConnections = dbConnections
        const availableDatabases = Object.keys(this._dbConnections)
        this._replicaPoolsConfig = getReplicaPoolsConfig(replicaPools || conf['DATABASE_POOLS'], availableDatabases)
        this._routingRules = getQueryRoutingRules(routingRules || conf['DATABASE_ROUTING_RULES'], this._replicaPoolsConfig)
    }

    /**
     * Initializes PrismaClient instances for all configured databases.
     * Each database gets its own PrismaClient pointing to its connection URL.
     * @returns {Promise<Record<string, import('@prisma/client').PrismaClient>>}
     */
    async _initPrismaClients (rels) {
        // NOTE: Generate schema and client code once using the parent's mechanism.
        // The generated client code is the same for all databases (same schema).
        await this._generateClient(rels)
        const { PrismaClient, Prisma } = require(this.clientPath)

        const dbNames = Object.keys(this._dbConnections)
        const clients = {}

        for (const dbName of dbNames) {
            const url = this._dbConnections[dbName]
            const dbSchemaUrl = this.dbSchemaName ? `${url}?schema=${this.dbSchemaName}` : url

            const prismaOptions = {
                datasources: { [this.provider]: { url: dbSchemaUrl } },
            }

            if (this.enableLogging) {
                prismaOptions.log = ['query']
            }

            let client = new PrismaClient(prismaOptions)
            client.DbNull = Prisma.DbNull

            if (this.relationLoadStrategy === 'query') {
                const clientRef = { current: null }

                const handleMutationWithInclude = async (args, query, model, clientRef) => {
                    const include = args.include
                    if (!include) return query(args)

                    delete args.include
                    const result = await query(args)
                    const modelName = model.charAt(0).toLowerCase() + model.slice(1)
                    return clientRef.current[modelName].findUnique({
                        where: { id: result.id },
                        include,
                    })
                }

                const applyQueryStrategy = (args) => {
                    if (!args.relationLoadStrategy) {
                        args.relationLoadStrategy = 'query'
                    }
                }

                client = client.$extends({
                    query: {
                        $allModels: {
                            async create ({ args, query, model }) {
                                return handleMutationWithInclude(args, query, model, clientRef)
                            },
                            async update ({ args, query, model }) {
                                return handleMutationWithInclude(args, query, model, clientRef)
                            },
                            async findMany ({ args, query }) {
                                applyQueryStrategy(args)
                                return query(args)
                            },
                            async findFirst ({ args, query }) {
                                applyQueryStrategy(args)
                                return query(args)
                            },
                            async findUnique ({ args, query }) {
                                applyQueryStrategy(args)
                                return query(args)
                            },
                        },
                    },
                })
                clientRef.current = client
            }

            try {
                await client.$connect()
                clients[dbName] = client
            } catch (err) {
                // NOTE: Gracefully disconnect already connected clients on partial failure
                await Promise.all(
                    Object.values(clients).map(c => c.$disconnect().catch(() => {}))
                )
                throw new Error(`Failed to connect to database "${dbName}": ${String(err)}`)
            }
        }

        return clients
    }

    /**
     * Selects the target pool based on routing rules and current context.
     * @param {string} modelName - Prisma model name (table name)
     * @param {string} operation - Prisma operation name (findMany, create, etc.)
     * @returns {PrismaPool}
     */
    _selectTargetPool (modelName, operation) {
        const gqlContext = graphqlCtx.getStore()
        const gqlOperationType = get(gqlContext, 'gqlOperationType')
        const gqlOperationName = get(gqlContext, 'gqlOperationName')

        const sqlOperationName = PRISMA_OP_TO_SQL[operation] || 'select'

        const context = { gqlOperationType, gqlOperationName, sqlOperationName, tableName: modelName }

        for (const rule of this._routingRules) {
            if (isRuleMatching(rule, context)) {
                return this._replicaPools[rule.target]
            }
        }

        // NOTE: Should never throw because of default rule
        logger.error({ msg: 'None of routing rule matched Prisma query', modelName, operation, meta: context })
        throw new Error('None of routing rule matched Prisma query')
    }

    /**
     * Creates a proxy for a Prisma model delegate that routes operations
     * to the correct database pool based on routing rules.
     *
     * @param {string} modelName - the Prisma model name (e.g., 'user', 'ticket')
     * @returns {Proxy}
     */
    _createRoutingModelProxy (modelName) {
        return new Proxy({}, {
            get: (_target, prop) => {
                if (typeof prop !== 'string' || prop.startsWith('_')) {
                    return undefined
                }

                if (PRISMA_OP_TO_SQL[prop]) {
                    return (...args) => {
                        const pool = this._selectTargetPool(modelName, prop)
                        const prismaClient = pool.getPrismaClient()
                        return prismaClient[modelName][prop](...args)
                    }
                }

                const defaultClient = this._defaultPool.getPrismaClient()
                return defaultClient[modelName][prop]
            },
        })
    }

    async _connect ({ rels }) {
        this._prismaClients = await this._initPrismaClients(rels)

        this._replicaPools = Object.fromEntries(
            Object.entries(this._replicaPoolsConfig).map(([name, config]) => [
                name,
                new PrismaPool({
                    ...omit(config, ['databases']),
                    prismaClients: config.databases.map((dbName) => this._prismaClients[dbName]),
                }),
            ])
        )

        const defaultRule = this._routingRules.find(rule => isDefaultRule(rule))
        this._defaultPool = this._replicaPools[defaultRule.target]

        // NOTE: Set this.prisma to the default pool's primary client for backward compatibility.
        // This is used by raw queries ($queryRaw, $queryRawUnsafe), health checks, etc.
        this.prisma = this._defaultPool.getPrismaClient()
    }

    async postConnect ({ rels }) {
        // NOTE: Wire up each list adapter's model to use a routing proxy
        // instead of the default prisma model. This ensures that queries
        // are routed to the correct database based on routing rules.
        Object.values(this.listAdapters).forEach(listAdapter => {
            const modelName = listAdapter.key.slice(0, 1).toLowerCase() + listAdapter.key.slice(1)

            listAdapter._postConnect({ rels, prisma: this.prisma })

            // NOTE: Replace the model with a routing proxy AFTER _postConnect sets it up
            listAdapter.model = this._createRoutingModelProxy(modelName)
        })

        if (this.config.dropDatabase && process.env.NODE_ENV !== 'production') {
            await this.dropDatabase()
        }

        return []
    }

    async disconnect () {
        if (this._prismaClients) {
            await Promise.all(
                Object.values(this._prismaClients).map(client => client.$disconnect().catch(() => {}))
            )
        }
    }

    async checkDatabaseVersion () {
        const dbNames = Object.keys(this._prismaClients)
        const results = await Promise.allSettled(
            dbNames.map(async (dbName) => {
                const client = this._prismaClients[dbName]
                const [{ server_version: version }] = await client.$queryRawUnsafe('SHOW server_version;')
                return { dbName, version }
            })
        )

        const failedIdx = Array
            .from({ length: dbNames.length }, (_, i) => i)
            .filter(i => results[i].status === 'rejected')

        if (failedIdx.length) {
            const errorDetails = failedIdx
                .map(i => `${' '.repeat(4)}^ ${dbNames[i]}: ${String(results[i].reason)}`)
                .join('\n')

            await this.disconnect()
            throw new Error(`One or more databases failed version check.\n${errorDetails}`)
        }
    }

    __kmigratorKnexAdapters () {
        // NOTE: For migrations, use the main database connection (first in the list)
        // Create a temporary adapter with the main database URL for schema extraction
        logger.info('BalancingReplicaPrismaAdapter: Starting schema extraction for migrations')
        
        const mainDbUrl = Object.values(this._dbConnections)[0]
        const tempAdapter = new PrismaAdapter({ url: mainDbUrl, migrationMode: 'none', relationLoadStrategy: 'query' })
        
        // Copy all necessary properties from this adapter to the temp adapter
        tempAdapter.listAdapters = this.listAdapters
        tempAdapter.getListAdapterByKey = this.getListAdapterByKey.bind(this)
        tempAdapter.getDbSchemaName = this.getDbSchemaName ? this.getDbSchemaName.bind(this) : undefined
        
        // Call the parent's __kmigratorKnexAdapters on the temp adapter
        try {
            const result = tempAdapter.__kmigratorKnexAdapters()
            logger.info('BalancingReplicaPrismaAdapter: Successfully extracted schema for migrations')
            return result
        } catch (err) {
            logger.error('BalancingReplicaPrismaAdapter: Schema extraction failed', { message: err.message, stack: err.stack })
            throw err
        }
    }
}

module.exports = {
    BalancingReplicaPrismaAdapter,
}
