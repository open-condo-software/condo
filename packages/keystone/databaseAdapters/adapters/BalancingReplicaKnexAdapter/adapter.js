const { KnexAdapter } = require('@open-keystone/adapter-knex')
const { versionGreaterOrEqualTo } = require('@open-keystone/utils')
const get = require('lodash/get')
const omit = require('lodash/omit')

const conf = require('@open-condo/config')
const { graphqlCtx } = require('@open-condo/keystone/KSv5v6/utils/graphqlCtx')

const { KnexPool, ProviderPool } = require('./pool')
const { planCrossPoolSelect } = require('./utils/crossSourceSelectSql')
const { getNamedDBs, getReplicaPoolsConfig, getQueryRoutingRules, isDefaultRule } = require('./utils/env')
const { initKnexClient } = require('./utils/knex')
const { logger } = require('./utils/logger')
const { isRuleMatching } = require('./utils/rules')
const { extractCRUDQueryData } = require('./utils/sql')

const { getDataProvider, resolvePoolProvider } = require('../../dataProviders')
const { createPoolBasedSourceRegistry } = require('../../sourceRegistry')
const { validateCrossSourceReferences } = require('../../crossDb/validateCrossSourceReferences')
const { createKmigratorKnexAdapter } = require('../../utils/kmigratorKnexAdapter')

/**
 * Multi-database Knex adapter.
 *
 * **How it works (one sentence):** every Knex query is intercepted, matched against
 * `DATABASE_ROUTING_RULES`, and sent to the chosen pool; optional cross-pool JOIN
 * rewrite and write mirroring happen inside that hook.
 *
 * **Activation:** `DATABASE_URL=custom:{...}` (see `databaseAdapters/README.md`).
 *
 * @extends KnexAdapter
 */
class BalancingReplicaKnexAdapter extends KnexAdapter {
    constructor ({ databaseUrl, replicaPools, routingRules }) {
        super()
        this._dbConnections = getNamedDBs(databaseUrl || conf['DATABASE_URL'])
        const availableDatabases = Object.keys(this._dbConnections)
        this._replicaPoolsConfig = getReplicaPoolsConfig(replicaPools || conf['DATABASE_POOLS'], availableDatabases)
        this._routingRules = getQueryRoutingRules(routingRules || conf['DATABASE_ROUTING_RULES'], this._replicaPoolsConfig)
        this._sourceRegistry = null
    }

    /** @returns {Promise<Record<string, import('knex').Knex>>} */
    async _initKnexClients () {
        const dbNames = Object.keys(this._dbConnections)
        const maxConnections = conf['DATABASE_POOL_MAX'] ? parseInt(conf['DATABASE_POOL_MAX']) : 3
        const connectionResults = await Promise.allSettled(
            dbNames.map(dbName => initKnexClient({
                client: 'postgres',
                pool: { min: 0, max: maxConnections },
                connection: this._dbConnections[dbName],
            })),
        )
        const failedIdx = Array
            .from({ length: dbNames.length }, (_, i) => i)
            .filter(i => connectionResults[i].status === 'rejected')

        if (failedIdx.length) {
            const errorDetails = failedIdx
                .map(i => `${' '.repeat(4)}^ ${dbNames[i]}: ${String(connectionResults[i].reason)}`)
                .join('\n')

            await Promise.all(
                connectionResults
                    .filter(result => result.status === 'fulfilled')
                    .map(result => result.value.destroy()),
            )

            throw new Error(`One or more databases failed to connect.\n${errorDetails}`)
        }

        return Object.fromEntries(dbNames.map((name, idx) => [name, connectionResults[idx].value]))
    }

    /**
     * Pick a pool using `DATABASE_ROUTING_RULES` (first matching rule wins).
     *
     * @param {{ gqlOperationType?: string, gqlOperationName?: string, sqlOperationName?: string, tableName?: string }} context
     * @returns {KnexPool}
     */
    _routeToPool (context) {
        for (const rule of this._routingRules) {
            if (isRuleMatching(rule, context)) {
                return this._replicaPools[rule.target]
            }
        }

        logger.error({ msg: 'no routing rule matched query', data: { context } })
        throw new Error('None of routing rule matched SQL-query')
    }

    /** Route a raw SQL string using GraphQL context from async local storage. */
    _selectTargetPool (sql) {
        const gqlContext = graphqlCtx.getStore()
        const { sqlOperationName, tableName } = extractCRUDQueryData(sql)

        return this._routeToPool({
            gqlOperationType: get(gqlContext, 'gqlOperationType'),
            gqlOperationName: get(gqlContext, 'gqlOperationName'),
            sqlOperationName,
            tableName,
        })
    }

    /** @param {KnexPool} pool */
    _getPoolName (pool) {
        return Object.entries(this._replicaPools).find(([, candidate]) => candidate === pool)?.[0]
    }

    /** @returns {Promise<Record<string, Set<string>>>} table names per pool (for write mirroring) */
    async _initPoolTables () {
        const poolEntries = Object.entries(this._replicaPools)
        const poolTables = {}
        await Promise.all(poolEntries.map(async ([poolName, pool]) => {
            if (this._replicaPoolsConfig[poolName]?.provider) {
                poolTables[poolName] = new Set()
                return
            }

            try {
                const knexClient = pool.getKnexClient()
                const rows = await knexClient
                    .select('table_name')
                    .from('information_schema.tables')
                    .where({ table_schema: 'public' })
                poolTables[poolName] = new Set(rows.map(row => row.table_name))
            } catch (err) {
                logger.warn({
                    msg: 'failed to load table registry for pool',
                    err,
                    data: { poolName },
                })
                poolTables[poolName] = new Set()
            }
        }))
        return poolTables
    }

    /**
     * Writable pools (other than the primary target) that contain `tableName`.
     * Used for best-effort mirror writes after a successful primary mutation.
     */
    _findMirrorPools ({ selectedPoolName, tableName }) {
        if (!selectedPoolName || !tableName) return []

        return Object.entries(this._replicaPools)
            .filter(([poolName, pool]) => {
                if (poolName === selectedPoolName) return false
                if (!pool._writable) return false
                const tables = this._poolTables?.[poolName]
                return tables && tables.has(tableName)
            })
            .map(([, pool]) => pool)
    }

    /** Validate cross-source FK columns before INSERT/UPDATE when DB constraints are absent. */
    async _tryValidateCrossSourceReferences ({
        sqlObject,
        finalTableName,
        finalSqlOperationName,
        gqlOperationType,
        gqlOperationName,
    }) {
        if (!['insert', 'update'].includes(finalSqlOperationName)) return

        const listAdapter = this.listAdapters?.[finalTableName]
        if (!listAdapter) return

        await validateCrossSourceReferences({
            tableName: finalTableName,
            listAdapter,
            sql: sqlObject.sql,
            bindings: sqlObject.bindings,
            sqlOperationName: finalSqlOperationName,
            sourceRegistry: this._sourceRegistry,
            routeToPool: (context) => this._routeToPool(context),
            gqlOperationType,
            gqlOperationName,
        })
    }

    /**
     * Cross-pool SELECT rewrite: run join filters on remote pool, replace JOIN with `fk IN (...)`.
     * @returns {Promise<*|undefined>} query rows when rewrite applied, otherwise `undefined`
     */
    async _tryCrossPoolSelectRewrite ({
        builder,
        selectedPool,
        finalTableName,
        finalSqlOperationName,
        gqlOperationType,
        gqlOperationName,
    }) {
        if (finalSqlOperationName !== 'select') return undefined

        const plannedSql = await planCrossPoolSelect({
            sql: builder.toString(),
            baseTableName: finalTableName,
            gqlOperationType,
            gqlOperationName,
            sqlOperationName: finalSqlOperationName,
            routeToPool: (context) => this._routeToPool(context),
            getPoolName: (pool) => this._getPoolName(pool),
        })
        if (!plannedSql) return undefined

        const directResult = await selectedPool.getKnexClient().raw(plannedSql)
        return directResult.rows || directResult
    }

    /** Best-effort mirror of a mutation to other writable pools. Failures are logged only. */
    async _mirrorMutation ({ mirrorPools, sql, bindings }) {
        for (const mirrorPool of mirrorPools) {
            try {
                const mirrorClient = mirrorPool.getKnexClient()
                await mirrorClient.raw(sql, bindings || [])
            } catch (err) {
                logger.error({
                    msg: 'cross-pool mirror write failed',
                    err,
                    data: { sql },
                })
            }
        }
    }

    /**
     * Keystone calls `this.knex` for every query. We replace `knex.client.runner` so
     * routing, cross-pool SELECT rewrite, and mirror writes happen transparently.
     */
    _patchKnexRunner () {
        this.knex.client.runner = (builder) => {
            try {
                const sqlObject = builder.toSQL()
                const gqlContext = graphqlCtx.getStore()
                const gqlOperationType = get(gqlContext, 'gqlOperationType')
                const gqlOperationName = get(gqlContext, 'gqlOperationName')

                // Batched SQL (migrations) always goes to the default writable pool
                if (Array.isArray(sqlObject)) {
                    return this._defaultPool.getQueryRunner(builder)
                }

                const sqlQueryWithPositionalBindings = this.knex.client.positionBindings(sqlObject.sql)
                const { sqlOperationName: finalSqlOperationName, tableName: finalTableName } =
                    extractCRUDQueryData(sqlQueryWithPositionalBindings)

                const selectedPool = this._selectTargetPool(sqlQueryWithPositionalBindings)
                const primaryRunner = selectedPool.getQueryRunner(builder)
                const isMutation = ['insert', 'update', 'delete'].includes(finalSqlOperationName)
                const selectedPoolName = this._getPoolName(selectedPool)
                const mirrorPools = isMutation
                    ? this._findMirrorPools({ selectedPoolName, tableName: finalTableName })
                    : []
                const needsCrossSourceValidation = ['insert', 'update'].includes(finalSqlOperationName)
                    && Boolean(this.listAdapters?.[finalTableName])

                const shouldWrapRunner = finalSqlOperationName === 'select'
                    || mirrorPools.length > 0
                    || needsCrossSourceValidation
                if (!shouldWrapRunner) {
                    return primaryRunner
                }

                const originalPrimaryRun = primaryRunner.run.bind(primaryRunner)

                primaryRunner.run = async () => {
                    let primaryResult = await this._tryCrossPoolSelectRewrite({
                        builder,
                        selectedPool,
                        finalTableName,
                        finalSqlOperationName,
                        gqlOperationType,
                        gqlOperationName,
                    })

                    if (typeof primaryResult === 'undefined') {
                        if (needsCrossSourceValidation) {
                            await this._tryValidateCrossSourceReferences({
                                sqlObject,
                                finalTableName,
                                finalSqlOperationName,
                                gqlOperationType,
                                gqlOperationName,
                            })
                        }
                        primaryResult = await originalPrimaryRun()
                    }

                    if (mirrorPools.length > 0) {
                        await this._mirrorMutation({
                            mirrorPools,
                            sql: sqlObject.sql,
                            bindings: sqlObject.bindings,
                        })
                    }

                    return primaryResult
                }

                return primaryRunner
            } catch (err) {
                logger.error({ msg: 'unexpected error during SQL query routing', err })
                throw new Error(`Unexpected error happened during SQL query routing: ${String(err)}`)
            }
        }
    }

    async _connect () {
        this._knexClients = await this._initKnexClients()
        this._replicaPools = Object.fromEntries(
            Object.entries(this._replicaPoolsConfig).map(([name, config]) => {
                if (config.provider) {
                    return [name, new ProviderPool({ provider: config.provider, writable: config.writable })]
                }
                return [name, new KnexPool({
                    ...omit(config, ['databases']),
                    knexClients: config.databases.map((dbName) => this._knexClients[dbName]),
                })]
            }),
        )
        this._poolTables = await this._initPoolTables()

        this._sourceRegistry = createPoolBasedSourceRegistry({
            poolTables: this._poolTables,
            routingRules: this._routingRules,
            replicaPoolsConfig: this._replicaPoolsConfig,
        })

        const defaultRule = this._routingRules.find(rule => isDefaultRule(rule))
        this._defaultPool = this._replicaPools[defaultRule.target]

        const defaultWritableDatabaseName = this._replicaPoolsConfig[defaultRule.target].databases[0]
        const fallbackConnection = this._dbConnections[defaultWritableDatabaseName]

        // Compatibility stub: Keystone needs `this.knex`, but real routing is in `_patchKnexRunner`
        this.knex = await initKnexClient({
            client: 'postgres',
            pool: { min: 0, max: 1 },
            connection: fallbackConnection,
        })

        this.knex.context.transaction = (...args) => {
            const defaultClient = this._defaultPool.getKnexClient()
            return defaultClient.context.transaction(...args)
        }

        this._patchKnexRunner()
    }

    /** Table → pool registry built from DATABASE_POOLS introspection and routing rules. */
    getSourceRegistry () {
        if (!this._sourceRegistry) {
            throw new Error('BalancingReplicaKnexAdapter source registry is not initialized')
        }
        return this._sourceRegistry
    }

    /** Tear down compatibility knex stub and all named database clients. */
    async disconnect () {
        if (this.knex) {
            await this.knex.destroy()
        }
        if (this._knexClients) {
            await Promise.all(Object.values(this._knexClients).map(client => client.destroy()))
        }
    }

    /**
     * Delegates find to a registered data provider (`dataProviders/index.js`) when the table
     * source is not a postgres pool (e.g. `kv`). Otherwise uses the Keystone list adapter.
     */
    async executeFind ({ schemaName, condition, listAdapter }) {
        const poolName = this._sourceRegistry.resolveSource(schemaName)
        const providerName = resolvePoolProvider(poolName, this._replicaPoolsConfig)
        const provider = getDataProvider(providerName)
        if (provider?.canFind({ condition })) {
            return provider.find({ schemaName, condition })
        }
        return listAdapter.find(condition)
    }

    /**
     * One kmigrator stub per writable named database (read-only replica DBs are skipped).
     * Default pool database is last so kmigrator writes the primary connection file last.
     */
    __kmigratorKnexAdapters () {
        if (!this._knexClients) {
            throw new Error('BalancingReplicaKnexAdapter is not connected')
        }

        const defaultRule = this._routingRules.find(rule => isDefaultRule(rule))
        const defaultDbName = this._replicaPoolsConfig[defaultRule.target].databases[0]
        const schemaName = typeof this.getDbSchemaName === 'function' ? this.getDbSchemaName() : 'public'

        const writableDbNames = new Set()
        for (const poolConfig of Object.values(this._replicaPoolsConfig)) {
            if (!poolConfig.writable) continue
            for (const dbName of poolConfig.databases) {
                writableDbNames.add(dbName)
            }
        }

        const orderedDbNames = [
            ...[...writableDbNames].filter(name => name !== defaultDbName).sort(),
            defaultDbName,
        ].filter(name => this._knexClients[name])

        return orderedDbNames.map(dbName => createKmigratorKnexAdapter({
            knex: this._knexClients[dbName],
            listAdapters: this.listAdapters,
            getListAdapterByKey: this.getListAdapterByKey.bind(this),
            rels: this.rels,
            schemaName,
            dbName,
        }))
    }

    async checkDatabaseVersion () {
        async function checkKnexDBVersion (knex, minVersion) {
            let version
            try {
                const result = await knex.raw('SHOW server_version;')
                version = result.rows[0].server_version
            } catch (err) {
                throw new Error(`Error reading version from postgresql: ${err}`)
            }

            if (!versionGreaterOrEqualTo(version, minVersion)) {
                throw new Error(
                    `postgresql version ${version} is incompatible. Version ${minVersion} or later is required.`,
                )
            }
        }

        const dbNames = Object.keys(this._knexClients)
        const results = await Promise.allSettled(
            dbNames.map((dbName) => checkKnexDBVersion(this._knexClients[dbName], this.minVer)),
        )

        const failedIdx = Array
            .from({ length: dbNames.length }, (_, i) => i)
            .filter(i => results[i].status === 'rejected')

        if (failedIdx.length) {
            const errorDetails = failedIdx
                .map(i => `${' '.repeat(4)}^ ${dbNames[i]}: ${String(results[i].reason)}`)
                .join('\n')

            await this.knex.destroy()
            await Promise.all(Object.values(this._knexClients).map(knex => knex.destroy()))

            throw new Error(`One or more databases has non-supported versions.\n${errorDetails}`)
        }
    }
}

module.exports = {
    BalancingReplicaKnexAdapter,
}
