const { KnexAdapter } = require('@open-keystone/adapter-knex')
const { versionGreaterOrEqualTo } = require('@open-keystone/utils')
const get = require('lodash/get')
const omit = require('lodash/omit')

const conf = require('@open-condo/config')
const { graphqlCtx } = require('@open-condo/keystone/KSv5v6/utils/graphqlCtx')

const { KnexPool } = require('./pool')
const { getNamedDBs, getReplicaPoolsConfig, getQueryRoutingRules, isDefaultRule } = require('./utils/env')
const { initKnexClient } = require('./utils/knex')
const { logger } = require('./utils/logger')
const { isRuleMatching } = require('./utils/rules')
const { extractCRUDQueryData } = require('./utils/sql')


class BalancingReplicaKnexAdapter extends KnexAdapter {
    constructor ({ databaseUrl, replicaPools, routingRules }) {
        super()

        this._dbConnections = getNamedDBs(databaseUrl || conf['DATABASE_URL'])
        const availableDatabases = Object.keys(this._dbConnections)
        this._replicaPoolsConfig = getReplicaPoolsConfig(replicaPools || conf['DATABASE_POOLS'], availableDatabases)
        this._routingRules = getQueryRoutingRules(routingRules || conf['DATABASE_ROUTING_RULES'], this._replicaPoolsConfig)
    }

    async _initKnexClients () {
        const dbNames = Object.keys(this._dbConnections)
        const connectionResults = await Promise.allSettled(
            dbNames.map(dbName => initKnexClient({
                client: 'postgres',
                pool: { min: 0, max: 3 },
                connection: this._dbConnections[dbName],
            }))
        )
        const failedIdx = Array
            .from({ length: dbNames.length }, (_, i) => i)
            .filter(i => connectionResults[i].status === 'rejected')

        if (failedIdx.length) {
            const errorDetails = failedIdx
                .map(i => `${' '.repeat(4)}^ ${dbNames[i]}: ${String(connectionResults[i].reason)}`)
                .join('\n')

            // NOTE: Gracefully remove connected clients on partial fail
            await Promise.all(
                connectionResults
                    .filter(result => result.status === 'fulfilled')
                    .map(result => result.value.destroy())
            )

            throw new Error(`One or more databases failed to connect.\n${errorDetails}`)
        }

        return Object.fromEntries(dbNames.map((name, idx) => [name, connectionResults[idx].value]))
    }

    _selectTargetPool (sql) {
        const gqlContext = graphqlCtx.getStore()
        const gqlOperationType = get(gqlContext, 'gqlOperationType')
        const gqlOperationName = get(gqlContext, 'gqlOperationName')

        const { sqlOperationName, tableName } = extractCRUDQueryData(sql)

        const context = { gqlOperationType, gqlOperationName, sqlOperationName, tableName }

        for (const rule of this._routingRules) {
            if (isRuleMatching(rule, context)) {
                return this._replicaPools[rule.target]
            }
        }

        // NOTE: Should never throw because of default rule
        logger.error({ msg: 'None of routing rule matched SQL-query', sqlQuery: sql, meta: context })
        throw new Error('None of routing rule matched SQL-query')
    }

    async _connect () {
        this._knexClients = await this._initKnexClients()
        this._replicaPools = Object.fromEntries(
            Object.entries(this._replicaPoolsConfig).map(([name, config]) => [
                name,
                new KnexPool({
                    ...omit(config, ['databases']),
                    knexClients: config.databases.map((dbName) => this._knexClients[dbName]),
                }),
            ])
        )


        const defaultRule = this._routingRules.find(rule => isDefaultRule(rule))
        this._defaultPool = this._replicaPools[defaultRule.target]

        // NOTE: We need to initialize this.knex to be compatible with KS.
        // Even though it won't execute requests by itself, it needs some connection-string to initialize it.
        // We can get it from any of the default pool databases.
        const defaultWritableDatabaseName = this._replicaPoolsConfig[defaultRule.target].databases[0]
        const fallbackConnection = this._dbConnections[defaultWritableDatabaseName]

        this.knex = await initKnexClient({
            client: 'postgres',
            pool: { min: 0, max: 1 },
            connection: fallbackConnection,
        })

        // NOTE: All migrations and other transactions should go to default pool
        this.knex.context.transaction = (...args) => {
            const defaultClient = this._defaultPool.getKnexClient()

            return defaultClient.context.transaction(...args)
        }

        this.knex.client.runner = (builder) => {
            try {
                const sqlObject = builder.toSQL()

                // NOTE: Right now partial routing is not implemented.
                // In real life there's no array cases at all, except few occurrences in migrations with length === 1
                // So for safe behaviour we'll redirect any batched queries to default writable pool
                if (Array.isArray(sqlObject)) {
                    return this._defaultPool.getQueryRunner(builder)
                }

                // NOTE: builder.toSQL() in single-query case will return object of shape:
                // { method: "<knex-method>", sql: "select * from ... limit ?", bindings: [100] }
                // parser cannot understand bindings, so we need to do some tricks, which Client_PG does under the hood
                const sqlQueryWithPositionalBindings = this.knex.client.positionBindings(sqlObject.sql)

                const selectedPool = this._selectTargetPool(sqlQueryWithPositionalBindings)

                return selectedPool.getQueryRunner(builder)
            } catch (err) {
                logger.error({ msg: 'Unexpected error happened during SQL query routing', err })
                throw new Error(`Unexpected error happened during SQL query routing: ${String(err)}`)
            }
        }
    }

    async disconnect () {
        if (this.knex) {
            await this.knex.destroy()
        }
        if (this._knexClients) {
            await Promise.all(Object.values(this._knexClients).map(client => client.destroy()))
        }
    }

    async checkDatabaseVersion () {
        // Original KnexAdapter implementation
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
                    `postgresql version ${version} is incompatible. Version ${minVersion} or later is required.`
                )
            }
        }

        const dbNames = Object.keys(this._knexClients)
        const results = await Promise.allSettled(
            dbNames.map((dbName) => checkKnexDBVersion(this._knexClients[dbName], this.minVer))
        )

        const failedIdx = Array
            .from({ length: dbNames.length }, (_, i) => i)
            .filter(i => results[i].status === 'rejected')

        if (failedIdx.length) {
            const errorDetails = failedIdx
                .map(i => `${' '.repeat(4)}^ ${dbNames[i]}: ${String(results[i].reason)}`)
                .join('\n')

            // Close connections gracefully
            await this.knex.destroy()
            await Promise.all(Object.values(this._knexClients).map(knex => knex.destroy()))

            throw new Error(`One or more databases has non-supported versions.\n${errorDetails}`)
        }
    }
}

module.exports = {
    BalancingReplicaKnexAdapter,
}