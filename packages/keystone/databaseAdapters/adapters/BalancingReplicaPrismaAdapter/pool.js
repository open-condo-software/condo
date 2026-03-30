/**
 * A pool of PrismaClient instances, each of which can accept the same set of requests.
 * Equivalent of KnexPool but for Prisma clients.
 */
class PrismaPool {
    constructor ({ prismaClients, writable, balancer = 'RoundRobin' }) {
        this._clients = prismaClients
        this._writable = writable
        this._pointer = 0

        if (balancer !== 'RoundRobin') {
            throw new TypeError('Unknown balancer type. Expected one of the following: [RoundRobin]')
        }
    }

    /**
     * Chooses PrismaClient according to pool's balancer (round-robin)
     * @returns {import('@prisma/client').PrismaClient}
     */
    getPrismaClient () {
        const client = this._clients[this._pointer]
        this._pointer = (this._pointer + 1) % this._clients.length
        return client
    }

    get writable () {
        return this._writable
    }
}

module.exports = {
    PrismaPool,
}
