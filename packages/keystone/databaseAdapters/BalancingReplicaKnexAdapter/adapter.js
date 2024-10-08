const { KnexAdapter } = require('@keystonejs/adapter-knex')
const omit = require('lodash/omit')

const conf = require('@open-condo/config')

const { KnexPool } = require('./pool')
const { getNamedDBs, getReplicaPoolsConfig, getQueryRoutingRules, isDefaultRule } = require('./utils/env')
const { initKnexClient } = require('./utils/knex')


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
            throw new Error(`One or more databases failed to connect.\n${errorDetails}`)
        }

        return Object.fromEntries(dbNames.map((name, idx) => [name, connectionResults[idx].value]))
    }

    _selectTargetPool (sql) {
        
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
        const defaultWritableDatabase = this._replicaPoolsConfig[defaultRule.target].databases[0]
        const fallbackConnection = this._dbConnections[defaultWritableDatabase]

        this.knex = await initKnexClient({
            client: 'postgres',
            pool: { min: 0, max: 1 },
            connection: fallbackConnection,
        })

        this.knex.client.runner = (builder) => {
            try {
                const sql = builder.toSQL()

                if (Array.isArray(sql)) {
                    return this._defaultPool.getQueryRunner(builder)
                }

                const selectedPool = this._selectTargetPool(sql)

                return selectedPool.getQueryRunner(builder)
            } catch (err) {
                // TODO: log, error?
            }

            // TODO: log, error?
        }
    }

    // TODO: disconnect
}

module.exports = {
    BalancingReplicaKnexAdapter,
}