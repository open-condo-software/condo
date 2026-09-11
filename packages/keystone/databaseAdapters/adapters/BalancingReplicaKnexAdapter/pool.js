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
 * The provider owns connect / disconnect; this pool is only a routing target.
 */
class ProviderPool {
    constructor ({ provider, writable = false, dataProvider = null }) {
        this._provider = provider
        this._writable = writable
        this.dataProvider = dataProvider
    }

    get providerName () {
        return this._provider
    }

    get writable () {
        return this._writable
    }

    async disconnect () {
        if (typeof this.dataProvider?.disconnect === 'function') {
            await this.dataProvider.disconnect()
        }
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
