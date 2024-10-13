const { initBalancer } = require('./utils/balancers')

class KnexPool {
    constructor ({ knexClients, writable, balancer, balancerOptions }) {
        this._clients = knexClients
        this._writable = writable
        this.balancer = initBalancer(balancer, this._clients, balancerOptions)
    }

    getKnexClient () {
        return this.balancer.selectExecutor()
    }

    getQueryRunner (builder) {
        const executor = this.getKnexClient()

        return executor.client.runner(builder)
    }
}

module.exports = {
    KnexPool,
}