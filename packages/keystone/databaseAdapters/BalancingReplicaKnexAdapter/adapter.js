const { KnexAdapter } = require('@keystonejs/adapter-knex')

const conf = require('@open-condo/config')

class BalancingReplicaKnexAdapter extends KnexAdapter {
    constructor ({ databaseUrl, ...baseKnexConfig }) {
        super(baseKnexConfig)

        this.databaseUrl = databaseUrl || conf['DATABASE_URL']
        this
    }
}