const { KnexAdapter } = require('@open-keystone/adapter-knex')

/**
 * Lightweight knex handle for kmigrator when one Keystone app owns several physical databases.
 * Reuses KnexAdapter._createTables so schema extraction matches single-DB behaviour.
 *
 * @param {{ knex: import('knex').Knex, listAdapters: object, getListAdapterByKey: Function, rels?: Array, schemaName?: string, dbName?: string }} options
 */
function createKmigratorKnexAdapter ({ knex, listAdapters, getListAdapterByKey, rels = [], schemaName = 'public', dbName }) {
    const stub = Object.create(KnexAdapter.prototype)

    stub.knex = knex
    stub.listAdapters = listAdapters
    stub.getListAdapterByKey = getListAdapterByKey
    stub.rels = rels
    stub.schemaName = schemaName
    stub.dbName = dbName
    stub.schema = function schema () {
        return knex.schema.withSchema(schemaName)
    }

    return stub
}

module.exports = {
    createKmigratorKnexAdapter,
}
