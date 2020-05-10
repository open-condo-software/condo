const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { MongooseAdapter } = require('@keystonejs/adapter-mongoose')

function getAdapter (databaseUrl) {
    if (!databaseUrl) throw new TypeError('getAdapter() call without databaseUrl')
    const Adapter = databaseUrl.startsWith('mongodb') ? MongooseAdapter : KnexAdapter
    const AdapterOpts = databaseUrl.startsWith('mongodb') ? { mongoUri: databaseUrl } : { knexOptions: { connection: databaseUrl } }
    return new Adapter(AdapterOpts)
}

module.exports = {
    getAdapter,
}
