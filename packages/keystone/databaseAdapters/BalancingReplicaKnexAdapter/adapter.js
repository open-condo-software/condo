const { KnexAdapter } = require('@keystonejs/adapter-knex')
const get = require('lodash/get')
const omit = require('lodash/omit')

const conf = require('@open-condo/config')
const { _internalGetAsyncLocalStorage, getExecutionContext } = require('@open-condo/keystone/executionContext')

const { KnexPool } = require('./pool')
const { getNamedDBs, getReplicaPoolsConfig, getQueryRoutingRules, isDefaultRule } = require('./utils/env')
const { initKnexClient } = require('./utils/knex')


const graphqlCtx = _internalGetAsyncLocalStorage('graphqlCtx')

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
        const operationType = get(gqlContext, ['info', 'operation', 'operation'])
        const operationName = get(gqlContext, ['info', 'fieldName'])
        const exc = getExecutionContext()

        for (const rule of this._routingRules) {
            if (rule.gqlOperationType && operationType !== rule.gqlOperationType) {
                continue
            }


            // if (rule.sqlOperationName && )

            return this._replicaPools[rule.target]
        }

        throw new Error('FINAL SELECT')
        // TODO: throw here?
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
            const gqlContext = graphqlCtx.getStore()
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
                // parser cannot understand bindings, so we need to insert it in query by using toString method
                const sqlQueryWithBindings = builder.toString()
                const selectedPool = this._selectTargetPool(sqlQueryWithBindings)

                return selectedPool.getQueryRunner(builder)
            } catch (err) {
                // TODO: log, error?
                throw new Error('CATCH')
            }

            // TODO: log, error?
            throw new Error('FINAL')
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
}

module.exports = {
    BalancingReplicaKnexAdapter,
}