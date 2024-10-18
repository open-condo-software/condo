class RoundRobinBalancer {
    constructor ({ knexClients, options }) {
        this._options = options
        this._knexClients = knexClients
        this._pointer = 0
    }

    selectExecutor () {
        const executor = this._knexClients[this._pointer]
        this._pointer = (this._pointer + 1) % this._knexClients.length

        return executor
    }
}

/**
 * Initializes pool's load balancer based on its configuration
 * @param {string} type - load balancer type
 * @param {Array<import('knex').Knex>} knexClients - a set of knex clients between which the load should be balanced
 * @param {unknown} options - additional balancer configuration
 * @returns {RoundRobinBalancer}
 */
function initBalancer (type, knexClients, options) {
    if (type === 'RoundRobin') {
        return new RoundRobinBalancer({ knexClients, options })
    }

    throw new TypeError('Unknown balancer type. Expected one of the following: [RoundRobin]')
}

module.exports = {
    initBalancer,
}
