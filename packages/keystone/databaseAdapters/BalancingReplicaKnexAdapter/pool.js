const { initBalancer } = require('./utils/balancers')

class KnexPool {
    constructor ({ knexClients, writable, balancer, balancerOptions }) {
        this._clients = knexClients
        this._writable = writable
        this.balancer = initBalancer(balancer, this._clients, balancerOptions)
    }

    async run (builder) {
        const executor = this.balancer.selectExecutor()
        const dd =  executor.client.runner(builder)
        return dd
    }
}

module.exports = {
    KnexPool,
}