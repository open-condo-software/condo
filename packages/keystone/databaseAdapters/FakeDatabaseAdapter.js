const { BaseKeystoneAdapter } = require('@keystonejs/keystone')

class FakeDatabaseAdapter extends BaseKeystoneAdapter {
    constructor (opts = {}) {
        super(...arguments)
        this.name = 'fake'
    }

    newListAdapter (key, adapterConfig) {
        throw new Error('FakeDatabaseAdapter: newListAdapter() call')
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

module.exports = {
    FakeDatabaseAdapter,
}
