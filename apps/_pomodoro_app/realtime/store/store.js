class WrongArgumentError extends Error {
    constructor (message) {
        super(message)
        this.name = this.constructor.name
    }
}

/**
 * An abstraction over Object, could possibly have multiple impl
 */
class Store {
    constructor () {
        this._memory = {}
    }

    getEntityById (id) {
        if (id in this._memory) {
            return this._memory[id]
        }
        throw new WrongArgumentError(`The item by key: ${id} is not present in our records`)
    }

    setEntityById (id, val) {
        this._memory[id] = val
    }

    removeEntityById (id) {
        if (id in this._memory) {
            delete this._memory[id]
        } else {
            throw new WrongArgumentError(`The item by key: ${id} is not present in our records`)
        }
    }
}

module.exports = Store
