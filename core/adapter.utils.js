const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { MongooseAdapter } = require('@keystonejs/adapter-mongoose')

function getAdapter (databaseUrl) {
    const Adapter = databaseUrl.startsWith('mongodb') ? MongooseAdapter : KnexAdapter
    const AdapterOpts = databaseUrl.startsWith('mongodb') ? { mongoUri: databaseUrl } : { knexOptions: { connection: databaseUrl } }
    return new Adapter(AdapterOpts)
}

module.exports = {
    getAdapter,
}
