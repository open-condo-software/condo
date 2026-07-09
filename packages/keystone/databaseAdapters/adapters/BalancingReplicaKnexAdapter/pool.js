const { initBalancer } = require('./utils/balancers')

/**
 * A pool of knex clients, each of which can accept the same set of requests
 */
class KnexPool {
    constructor ({ knexClients, writable, balancer, balancerOptions }) {
        this._clients = knexClients
        this._writable = writable
        this.balancer = initBalancer(balancer, this._clients, balancerOptions)
    }

    /**
     * Chooses knex-client according to pool's balancer
     * @returns {import('knex').knex}
     */
    getKnexClient () {
        return this.balancer.selectExecutor()
    }

    /**
     * Chooses knex-client according to pool's balancer and returns its runner
     * @param builder
     */
    getQueryRunner (builder) {
        const executor = this.getKnexClient()

        return executor.client.runner(builder)
    }
}

/**
 * Non-SQL pool backed by a registered data provider (`DATABASE_POOLS.provider`).
 */
class ProviderPool {
    constructor ({ provider, writable = false }) {
        this._provider = provider
        this._writable = writable
    }

    getKnexClient () {
        throw new Error(`Pool "${this._provider}" uses data provider storage and does not support SQL`)
    }

    getQueryRunner () {
        throw new Error(`Pool "${this._provider}" uses data provider storage and does not support SQL`)
    }
}

module.exports = {
    KnexPool,
    ProviderPool,
}