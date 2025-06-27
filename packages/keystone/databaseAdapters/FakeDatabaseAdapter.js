const { BaseKeystoneAdapter, BaseListAdapter } = require('@open-keystone/keystone')

class FakeDatabaseAdapter extends BaseKeystoneAdapter {
    constructor (opts = {}) {
        super(...arguments)
        this.name = 'knex'
    }

    newListAdapter (key, adapterConfig) {
        return new FakeListAdapter(key, this, adapterConfig)
    }

    getListAdapterByKey (key) {
        throw new Error('FakeDatabaseAdapter: getListAdapterByKey() call')
    }

    async connect ({ rels }) {
        throw new Error('FakeDatabaseAdapter: connect() call')
    }

    async _connect () {
        throw new Error('FakeDatabaseAdapter: _connect() call')
    }

    async postConnect ({ rels }) {
        throw new Error('FakeDatabaseAdapter: postConnect() call')
    }

    disconnect () {
        throw new Error('FakeDatabaseAdapter: disconnect() call')
    }

    async checkDatabaseVersion () {
        throw new Error('FakeDatabaseAdapter: checkDatabaseVersion() call')
    }
}

class FakeListAdapter extends BaseListAdapter {
    async create (data) {
        throw new Error('FakeListAdapter: create() call')
    }

    async delete (id) {
        throw new Error('FakeListAdapter: delete() call')
    }

    async update (id, data) {
        throw new Error('FakeListAdapter: update() call')
    }

    async findAll () {
        throw new Error('FakeListAdapter: findAll() call')
    }

    async findById (id) {
        throw new Error('FakeListAdapter: findById() call')
    }

    async find (condition) {
        throw new Error('FakeListAdapter: find() call')
    }

    async findOne (condition) {
        throw new Error('FakeListAdapter: findOne() call')
    }

    async itemsQuery (args, { meta = false, from = {} } = {}) {
        throw new Error('FakeListAdapter: itemsQuery() call')
    }

    itemsQueryMeta (args) {
        throw new Error('FakeListAdapter: itemsQueryMeta() call')
    }
}

module.exports = {
    FakeDatabaseAdapter,
}
