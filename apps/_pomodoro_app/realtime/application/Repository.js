const AbstractRepository = require('./AbstractRepository')
const Exceptions = require('./Enums/Exceptions')

class RAMRepository extends AbstractRepository {
    constructor () {
        super()
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

module.exports = RAMRepository
