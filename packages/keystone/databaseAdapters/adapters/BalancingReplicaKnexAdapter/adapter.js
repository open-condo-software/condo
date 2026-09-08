const { KnexAdapter } = require('@open-keystone/adapter-knex')
const { versionGreaterOrEqualTo } = require('@open-keystone/utils')
const get = require('lodash/get')
const omit = require('lodash/omit')

const conf = require('@open-condo/config')
const {
    createTablePoolResolver,
    enforceCrossSourceDeleteConstraints,
    isUnsatisfiableWhere,
    listHasCrossSourceInbound,
    listHasCrossSourceOutbound,
    listNeedsCrossDbWhereRewrite,
    prepareCrossDbWhere,
    validateCrossSourceReferences,
} = require('@open-condo/keystone/databaseAdapters/crossDb')
const {
    applyItemsQueryToRows,
    executeProviderSqlMutation,
    executeProviderSqlSelect,
    getDataProvider,
    isDataProviderPool,
    providerSupportsCreate,
    providerSupportsDelete,
    providerSupportsFind,
    providerSupportsItemsQuery,
    providerSupportsUpdate,
    resolvePoolProvider,
} = require('@open-condo/keystone/databaseAdapters/dataProviders')
const { createKmigratorKnexAdapter } = require('@open-condo/keystone/databaseAdapters/utils')
const { graphqlCtx } = require('@open-condo/keystone/KSv5v6/utils/graphqlCtx')

const { KnexPool, ProviderPool } = require('./pool')
const { planCrossPoolSelect } = require('./utils/crossSourceSelectSql')
const { getNamedDBs, getReplicaPoolsConfig, getQueryRoutingRules, isDefaultRule } = require('./utils/env')
const { initKnexClient } = require('./utils/knex')
const { logger } = require('./utils/logger')
const { isRuleMatching } = require('./utils/rules')
const { extractCRUDQueryData } = require('./utils/sql')

/**
 * Multi-database Knex adapter.
 *
 * **How it works (one sentence):** every Knex query is intercepted, matched against
 * `DATABASE_ROUTING_RULES`, and sent to the chosen pool; optional cross-pool JOIN
 * rewrite happens inside that hook.
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
        this._tablePoolResolver = null
    }

    /** @returns {{ defaultPool: string, resolveTablePool: (tableName: string) => string }} */
    getTablePoolResolver () {
        return this._tablePoolResolver
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
     * Pick a pool **name** using `DATABASE_ROUTING_RULES` (first matching rule wins).
     * Resolve the pool object at the execution site via `this._replicaPools[name]`.
     *
     * @param {{ gqlOperationType?: string, gqlOperationName?: string, sqlOperationName?: string, tableName?: string }} context
     * @returns {string}
     */
    _routeToPoolName (context) {
        for (const rule of this._routingRules) {
            if (isRuleMatching(rule, context)) {
                return rule.target
            }
        }

        logger.error({ msg: 'no routing rule matched query', data: { context } })
        throw new Error('None of routing rule matched SQL-query')
    }

    /**
     * Choose which pool **name** runs this SQL: first matching `DATABASE_ROUTING_RULES` wins.
     * Config validation guarantees a default rule, so a match always exists.
     *
     * Dedicated-pool tables must appear in an early `tableName` rule.
     *
     * Cross-db ownership (planner / FK checks) still uses `resolveTablePool` —
     * that is independent of which pool executes this particular query.
     *
     * @param {string} sql
     * @param {{ sqlOperationName?: string, tableName?: string|null }|null} [preParsed]
     * @returns {string}
     */
    _selectTargetPoolName (sql, preParsed = null) {
        const gqlContext = graphqlCtx.getStore()
        const { sqlOperationName, tableName } = preParsed || extractCRUDQueryData(sql)

        return this._routeToPoolName({
            gqlOperationType: get(gqlContext, 'gqlOperationType'),
            gqlOperationName: get(gqlContext, 'gqlOperationName'),
            sqlOperationName,
            tableName,
        })
    }

    /** Validate cross-source FK columns / inbound delete rules when DB constraints are absent. */
    async _tryValidateCrossSourceReferences ({
        sqlObject,
        finalTableName,
        finalSqlOperationName,
    }) {
        const listAdapter = this.listAdapters?.[finalTableName]
        if (!listAdapter) return

        const hasOutbound = listHasCrossSourceOutbound(this, finalTableName)
        const hasInbound = listHasCrossSourceInbound(this, finalTableName)
        if (!hasOutbound && !hasInbound) return

        const sql = this.knex.client.positionBindings(sqlObject.sql)
        const bindings = sqlObject.bindings
        const getPoolByName = (poolName) => this._replicaPools[poolName]

        if (hasOutbound && ['insert', 'update'].includes(finalSqlOperationName)) {
            await validateCrossSourceReferences({
                tableName: finalTableName,
                listAdapter,
                sql,
                bindings,
                sqlOperationName: finalSqlOperationName,
                tablePoolResolver: this._tablePoolResolver,
                getPoolByName,
            })
        }

        if (hasInbound) {
            await enforceCrossSourceDeleteConstraints({
                tableName: finalTableName,
                listAdapters: this.listAdapters,
                sql,
                bindings,
                sqlOperationName: finalSqlOperationName,
                tablePoolResolver: this._tablePoolResolver,
                getPoolByName,
            })
        }
    }

    /**
     * Whether this mutation may need virtual cross-source FK checks.
     * Main-only tables (no outbound/inbound to another pool) return false → knex runs as before.
     * Inbound-only parents (e.g. Organization referenced from BillingReceipt) only wrap
     * hard DELETE and soft-delete UPDATEs — not ordinary updates.
     */
    _needsCrossSourceValidation (finalTableName, finalSqlOperationName, sql) {
        if (!['insert', 'update', 'delete'].includes(finalSqlOperationName)) return false
        if (!this.listAdapters?.[finalTableName]) return false

        const hasOutbound = listHasCrossSourceOutbound(this, finalTableName)
        const hasInbound = listHasCrossSourceInbound(this, finalTableName)
        if (!hasOutbound && !hasInbound) return false

        if (hasOutbound && ['insert', 'update'].includes(finalSqlOperationName)) return true
        if (hasInbound && finalSqlOperationName === 'delete') return true
        // Soft-delete sniff only — avoid wrapping every UPDATE on inbound parents.
        if (hasInbound && finalSqlOperationName === 'update' && /\b"?deletedAt"?\s*=/i.test(sql)) {
            return true
        }
        return false
    }

    /**
     * Cross-pool SELECT rewrite: run join filters on remote pool, replace JOIN with `fk IN (...)`.
     *
     * Fail-closed via {@link planCrossPoolSelect}: unsupported / unroutable cross-pool JOINs
     * throw — never fall back to running the original JOIN SQL on the selected pool.
     *
     * @returns {Promise<*|undefined>} query rows when rewrite applied, otherwise `undefined`
     *   (`undefined` only when rewrite is not needed: no JOIN or all JOINs same-pool)
     */
    async _tryCrossPoolSelectRewrite ({
        builder,
        selectedPoolName,
        selectedPool,
        finalTableName,
        finalSqlOperationName,
        gqlOperationType,
        gqlOperationName,
    }) {
        if (finalSqlOperationName !== 'select') return undefined
        // Main-only lists never JOIN another pool from the base table.
        if (!listHasCrossSourceOutbound(this, finalTableName)) return undefined

        // Must use interpolated SQL (`builder.toString()`), not positional `$N` SQL:
        // predicate extraction needs literal values, and the rewritten query is run via
        // `.raw(plannedSql)` without bindings.
        const plannedSql = await planCrossPoolSelect({
            sql: builder.toString(),
            baseTableName: finalTableName,
            gqlOperationType,
            gqlOperationName,
            sqlOperationName: finalSqlOperationName,
            routeToPoolName: (context) => this._routeToPoolName(context),
            getPoolByName: (name) => this._replicaPools[name],
        })
        if (!plannedSql) return undefined

        if (!selectedPoolName || typeof selectedPool?.getKnexClient !== 'function') {
            throw new Error(
                `Cannot execute rewritten cross-pool SELECT for "${finalTableName}": ` +
                `target pool "${selectedPoolName || 'unknown'}" is unavailable`,
            )
        }

        const directResult = await selectedPool.getKnexClient().raw(plannedSql)
        return directResult.rows || directResult
    }

    /** @returns {import('../../dataProviders/kv').KvDataProvider|null} */
    _getProviderForSchema (schemaName) {
        if (!this._tablePoolResolver) return null

        const poolName = this._tablePoolResolver.resolveTablePool(schemaName)
        if (!isDataProviderPool(poolName, this._replicaPoolsConfig)) return null

        return getDataProvider(resolvePoolProvider(poolName, this._replicaPoolsConfig))
    }

    _createProviderSqlRunner ({
        providerPool,
        finalTableName,
        finalSqlOperationName,
        sqlObject,
        sqlQueryWithPositionalBindings,
        needsCrossSourceValidation,
        gqlOperationType,
        gqlOperationName,
    }) {
        const provider = getDataProvider(providerPool.providerName)
        if (!provider) {
            throw new Error(`Unknown data provider "${providerPool.providerName}"`)
        }

        const runner = { options: {} }
        runner.run = async () => {
            if (finalSqlOperationName === 'select') {
                return executeProviderSqlSelect({
                    provider,
                    schemaName: finalTableName,
                    sql: sqlQueryWithPositionalBindings,
                    bindings: sqlObject.bindings,
                })
            }

            if (!providerPool.writable) {
                throw new Error(`Provider pool "${providerPool.providerName}" is read-only`)
            }

            if (needsCrossSourceValidation) {
                await this._tryValidateCrossSourceReferences({
                    sqlObject,
                    finalTableName,
                    finalSqlOperationName,
                })
            }

            return executeProviderSqlMutation({
                provider,
                schemaName: finalTableName,
                sqlOperationName: finalSqlOperationName,
                sql: sqlQueryWithPositionalBindings,
                bindings: sqlObject.bindings,
            })
        }

        return runner
    }

    /**
     * Keystone calls `this.knex` for every query. We replace `knex.client.runner` so
     * routing, cross-pool SELECT rewrite, and provider-pool CRUD happen transparently.
     */
    _patchKnexRunner () {
        this.knex.client.runner = (builder) => {
            try {
                const sqlObject = builder.toSQL()
                // Batched SQL (migrations) always goes to the default writable pool
                if (Array.isArray(sqlObject)) {
                    return this._defaultPool.getQueryRunner(builder)
                }

                const sqlQueryWithPositionalBindings = this.knex.client.positionBindings(sqlObject.sql)
                const crudQueryData = extractCRUDQueryData(sqlQueryWithPositionalBindings)
                const { sqlOperationName: finalSqlOperationName, tableName: finalTableName } = crudQueryData

                // Cross-db gates as early as possible (cached hints) — before pool pick / wrap.
                const needsCrossSourceValidation = this._needsCrossSourceValidation(
                    finalTableName,
                    finalSqlOperationName,
                    sqlQueryWithPositionalBindings,
                )
                const needsSelectRewrite = finalSqlOperationName === 'select'
                    && listHasCrossSourceOutbound(this, finalTableName)

                const gqlContext = graphqlCtx.getStore()
                const gqlOperationType = get(gqlContext, 'gqlOperationType')
                const gqlOperationName = get(gqlContext, 'gqlOperationName')

                const selectedPoolName = this._selectTargetPoolName(sqlQueryWithPositionalBindings, crudQueryData)
                const selectedPool = this._replicaPools[selectedPoolName]
                if (!selectedPool) {
                    throw new Error(`Routing target pool "${selectedPoolName}" is not configured`)
                }

                if (selectedPool instanceof ProviderPool) {
                    return this._createProviderSqlRunner({
                        providerPool: selectedPool,
                        finalTableName,
                        finalSqlOperationName,
                        sqlObject,
                        sqlQueryWithPositionalBindings,
                        needsCrossSourceValidation,
                        gqlOperationType,
                        gqlOperationName,
                    })
                }

                const primaryRunner = selectedPool.getQueryRunner(builder)
                if (!needsSelectRewrite && !needsCrossSourceValidation) {
                    return primaryRunner
                }

                const originalPrimaryRun = primaryRunner.run.bind(primaryRunner)

                primaryRunner.run = async () => {
                    let primaryResult
                    if (needsSelectRewrite) {
                        primaryResult = await this._tryCrossPoolSelectRewrite({
                            builder,
                            selectedPoolName,
                            selectedPool,
                            finalTableName,
                            finalSqlOperationName,
                            gqlOperationType,
                            gqlOperationName,
                        })
                    }

                    if (primaryResult === undefined) {
                        if (needsCrossSourceValidation) {
                            await this._tryValidateCrossSourceReferences({
                                sqlObject,
                                finalTableName,
                                finalSqlOperationName,
                            })
                        }
                        primaryResult = await originalPrimaryRun()
                    }

                    return primaryResult
                }

                return primaryRunner
            } catch (err) {
                logger.error({ msg: 'unexpected error during SQL query routing', err })
                throw new Error(
                    `Unexpected error happened during SQL query routing: ${err?.message || String(err)}`,
                    { cause: err },
                )
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

        // Home pool for cross-db logic: tableName routing rules + default.
        this._tablePoolResolver = createTablePoolResolver({
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

    /**
     * After list adapters exist, wrap find/itemsQuery so GraphQL access `where`
     * with cross-source relation filters is rewritten via CrossDbPlanner
     * (`context: { organization: ... }` → `context: { id_in: [...] }`) before SQL.
     */
    async postConnect ({ rels }) {
        const result = await super.postConnect({ rels })
        this._wrapListAdaptersWithCrossDbWhere()
        return result
    }

    _wrapListAdaptersWithCrossDbWhere () {
        if (this._crossDbWhereWrapped) return
        this._crossDbWhereWrapped = true

        for (const [listKey, listAdapter] of Object.entries(this.listAdapters || {})) {
            if (!listAdapter || listAdapter.__crossDbWhereWrapped) continue
            listAdapter.__crossDbWhereWrapped = true

            // Main-only lists: never pay prepareCrossDbWhere / getSchemaCtx.
            if (!listNeedsCrossDbWhereRewrite(this, listKey)) continue

            const originalItemsQuery = listAdapter.itemsQuery.bind(listAdapter)
            listAdapter.itemsQuery = async (args = {}, extra = {}) => {
                const where = await prepareCrossDbWhere({ listKey, where: args.where, adapter: this })
                if (isUnsatisfiableWhere(where)) {
                    return extra.meta ? { count: 0 } : []
                }
                return originalItemsQuery({ ...args, where }, extra)
            }

            const originalFind = listAdapter.find.bind(listAdapter)
            listAdapter.find = async (condition) => {
                const where = await prepareCrossDbWhere({ listKey, where: condition, adapter: this })
                if (isUnsatisfiableWhere(where)) return []
                return originalFind(where)
            }
        }
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
     * Delegates find to a registered data provider when the table is on a provider pool.
     */
    async executeFind ({ schemaName, condition, listAdapter }) {
        const where = await prepareCrossDbWhere({ listKey: schemaName, where: condition, adapter: this })
        if (isUnsatisfiableWhere(where)) return []

        const provider = this._getProviderForSchema(schemaName)
        if (providerSupportsFind(provider, where)) {
            return provider.find({ schemaName, condition: where })
        }
        return listAdapter.find(where)
    }

    async executeItemsQuery ({ schemaName, args, meta, from, listAdapter }) {
        const where = await prepareCrossDbWhere({ listKey: schemaName, where: args?.where, adapter: this })
        if (isUnsatisfiableWhere(where)) {
            return meta ? { count: 0 } : []
        }
        const nextArgs = { ...args, where }

        const provider = this._getProviderForSchema(schemaName)
        if (!providerSupportsItemsQuery(provider, nextArgs)) {
            return listAdapter.itemsQuery(nextArgs, { meta, from })
        }

        const rows = await provider.find({ schemaName, condition: nextArgs.where || {} })
        return meta ? { count: rows.length } : applyItemsQueryToRows(rows, nextArgs)
    }

    async executeCreate ({ schemaName, data, listAdapter }) {
        const provider = this._getProviderForSchema(schemaName)
        if (providerSupportsCreate(provider)) {
            return provider.create({ schemaName, data })
        }
        return listAdapter._create(data)
    }

    async executeUpdate ({ schemaName, id, data, listAdapter }) {
        const provider = this._getProviderForSchema(schemaName)
        if (providerSupportsUpdate(provider)) {
            return provider.update({ schemaName, id, data })
        }
        return listAdapter._update(id, data)
    }

    async executeDelete ({ schemaName, id, listAdapter }) {
        const provider = this._getProviderForSchema(schemaName)
        if (providerSupportsDelete(provider)) {
            return provider.delete({ schemaName, id })
        }
        return listAdapter._delete(id)
    }

    /**
     * One kmigrator stub per writable named database (read-only replica DBs are skipped).
     * Pools may opt out with `kmigrator: false` when they hold only routed subsets of tables.
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
            if (!poolConfig.writable || poolConfig.kmigrator === false || poolConfig.provider || !poolConfig.databases) continue
            for (const dbName of poolConfig.databases) {
                writableDbNames.add(dbName)
            }
        }

        const orderedDbNames = [
            ...[...writableDbNames].filter(name => name !== defaultDbName).sort((a, b) => a.localeCompare(b)),
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
