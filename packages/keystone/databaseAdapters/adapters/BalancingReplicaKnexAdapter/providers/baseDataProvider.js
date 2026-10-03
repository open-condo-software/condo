/**
 * Optional storage backend for schema operations (Redis, etc.).
 * Postgres-backed lists use the Keystone list adapter; override only what you support.
 */
class BaseDataProvider {
    supportsFind () {
        return false
    }

    supportsItemsQuery () {
        return false
    }

    supportsCreate () {
        return false
    }

    supportsUpdate () {
        return false
    }

    supportsDelete () {
        return false
    }

    async find () {
        throw new Error('find is not implemented for this data provider')
    }

    async itemsQuery () {
        throw new Error('itemsQuery is not implemented for this data provider')
    }

    async create () {
        throw new Error('create is not implemented for this data provider')
    }

    async update () {
        throw new Error('update is not implemented for this data provider')
    }

    async delete () {
        throw new Error('delete is not implemented for this data provider')
    }
}

module.exports = {
    BaseDataProvider,
}
