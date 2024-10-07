const { KnexAdapter } = require('@keystonejs/adapter-knex')

const conf = require('@open-condo/config')

const { getNamedDBs, getReplicaPoolsConfig, getQueryRoutingRules } = require('./utils/env')
const { initKnexClient } = require('./utils/knex')


class BalancingReplicaKnexAdapter extends KnexAdapter {
    constructor ({ databaseUrl, replicaPools, routingRules }) {
        super()

        this._dbConnections = getNamedDBs(databaseUrl || conf['DATABASE_URL'])
        const availableDatabases = Object.keys(this._dbConnections)
        this._replicaPoolsConfig = getReplicaPoolsConfig(replicaPools || conf['DATABASE_POOLS'], availableDatabases)
        this._routingRules = getQueryRoutingRules(routingRules || conf['DATABASE_ROUTING_RULES'], this._replicaPoolsConfig)
    }

    async _connect () {
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

        this._knexClients = Object.fromEntries(dbNames.map((name, idx) => [name, connectionResults[idx].value]))
    }

    async
}

module.exports = {
    BalancingReplicaKnexAdapter,
}