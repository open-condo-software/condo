const { KnexAdapter } = require('@keystonejs/adapter-knex')

const conf = require('@open-condo/config')

const { getNamedDBs } = require('./utils/env')


class BalancingReplicaKnexAdapter extends KnexAdapter {
    constructor ({ databaseUrl, ...baseKnexConfig }) {
        super(baseKnexConfig)

        this._dbConnections = getNamedDBs(databaseUrl || conf['DATABASE_URL'])
        this._replicaPoolsConfig = 1 // TODO
    }
}