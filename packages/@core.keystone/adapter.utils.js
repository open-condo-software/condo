const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { MongooseAdapter } = require('@keystonejs/adapter-mongoose')

function getAdapter (databaseUrl) {
    if (!databaseUrl) throw new TypeError('getAdapter() call without databaseUrl')
    if (typeof databaseUrl !== 'string') throw new TypeError('getAdapter() databaseUrl is not a string')
    if (databaseUrl.startsWith('mongodb')) {
        return new MongooseAdapter({ mongoUri: databaseUrl })
    } else if (databaseUrl.startsWith('postgres')) {
        return new KnexAdapter({ knexOptions: { connection: databaseUrl } })
    } else if (databaseUrl.startsWith('undefined')) {
        // NOTE: case for build time!
        const adapter = new MongooseAdapter()
        adapter.connect = () => {throw new Error('UndefinedAdapter.connect() call!')}
        adapter.postConnect = () => {throw new Error('UndefinedAdapter.postConnect() call!')}
        adapter.checkDatabaseVersion = () => {throw new Error('UndefinedAdapter.checkDatabaseVersion() call!')}
        return adapter
    } else {
        throw new Error(`getAdapter() call with unknown schema: ${databaseUrl}`)
    }
}

module.exports = {
    getAdapter,
}
