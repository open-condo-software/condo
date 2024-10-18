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

module.exports = {
    KnexPool,
}