const Exceptions = require('./Enums/Exceptions')

/**
 * An abstraction over Object, could possibly have multiple impl
 */
class Store {
    constructor () {
        this._memory = {}
    }

    getEntityById (id) {
        if (id in this._memory){
            return this._memory[id]
        }
        throw Exceptions.ArgumentException
    }

    setEntityById (id, val) {
        this._memory[id] = val
    }

    removeEntityById (id) {
        if (id in this._memory){
            delete this._memory[id]
        } else {
            throw Exceptions.ArgumentException
        }
    }
}

module.exports = Store
