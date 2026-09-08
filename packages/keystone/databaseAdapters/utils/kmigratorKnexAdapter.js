const { KnexAdapter } = require('@open-keystone/adapter-knex')

/**
 * Shallow-clones Keystone list adapters and rebinds them to a kmigrator stub parent.
 * Keeps schema extraction isolated from the live adapter so `_createTables` does not
 * mutate runtime list/field adapter instances.
 *
 * @param {Record<string, object>} listAdapters
 * @param {object} parentAdapter kmigrator knex stub returned by `createKmigratorKnexAdapter`
 * @returns {Record<string, object>}
 */
function cloneListAdaptersForKmigrator (listAdapters, parentAdapter) {
    const clonedListAdapters = Object.fromEntries(
        Object.entries(listAdapters || {}).map(([key, listAdapter]) => [key, Object.assign(
            Object.create(Object.getPrototypeOf(listAdapter)),
            listAdapter,
            { parentAdapter },
        )])
    )

    for (const [key, clonedListAdapter] of Object.entries(clonedListAdapters)) {
        if (clonedListAdapter.fieldAdaptersByPath) {
            clonedListAdapter.fieldAdaptersByPath = Object.fromEntries(
                Object.entries(clonedListAdapter.fieldAdaptersByPath).map(([path, fieldAdapter]) => [path, Object.assign(
                    Object.create(Object.getPrototypeOf(fieldAdapter)),
                    fieldAdapter,
                    { listAdapter: clonedListAdapter },
                )])
            )
        }

        if (Array.isArray(clonedListAdapter.fieldAdapters)) {
            clonedListAdapter.fieldAdapters = clonedListAdapter.fieldAdapters.map((fieldAdapter) => {
                const clonedFieldAdapter = clonedListAdapter.fieldAdaptersByPath?.[fieldAdapter.path]
                return clonedFieldAdapter || Object.assign(
                    Object.create(Object.getPrototypeOf(fieldAdapter)),
                    fieldAdapter,
                    { listAdapter: clonedListAdapter },
                )
            })
        }

        clonedListAdapter.getListAdapterByKey = (listKey) => clonedListAdapters[listKey]
        clonedListAdapters[key] = clonedListAdapter
    }

    return clonedListAdapters
}

/**
 * Rebinds relation metadata to cloned field adapters produced by `cloneListAdaptersForKmigrator`.
 *
 * @param {Array<object>} rels Keystone relation descriptors from the live adapter
 * @param {Record<string, object>} clonedListAdapters
 * @returns {Array<object>}
 */
function cloneRelsForKmigrator (rels, clonedListAdapters) {
    return (rels || []).map((rel) => {
        const clonedLeftAdapter = clonedListAdapters[rel.left?.listKey]?.fieldAdaptersByPath?.[rel.left?.path]
        const clonedRightAdapter = rel.right
            ? clonedListAdapters[rel.right.listKey]?.fieldAdaptersByPath?.[rel.right.path]
            : rel.right

        return {
            ...rel,
            left: {
                ...rel.left,
                adapter: clonedLeftAdapter || rel.left?.adapter,
            },
            right: rel.right ? {
                ...rel.right,
                adapter: clonedRightAdapter || rel.right.adapter,
            } : rel.right,
        }
    })
}

/**
 * Lightweight knex handle for kmigrator when one Keystone app owns several physical databases.
 * Reuses KnexAdapter._createTables so schema extraction matches single-DB behaviour.
 *
 * @param {{ knex: import('knex').Knex, listAdapters: object, getListAdapterByKey: Function, rels?: Array, schemaName?: string, dbName?: string }} options
 */
function createKmigratorKnexAdapter ({ knex, listAdapters, getListAdapterByKey, rels = [], schemaName = 'public', dbName }) {
    const stub = Object.create(KnexAdapter.prototype)

    stub.knex = knex
    stub.rels = rels
    stub.schemaName = schemaName
    stub.dbName = dbName
    stub.schema = function schema () {
        return knex.schema.withSchema(schemaName)
    }
    stub.listAdapters = cloneListAdaptersForKmigrator(listAdapters, stub)
    stub.rels = cloneRelsForKmigrator(rels, stub.listAdapters)
    Object.values(stub.listAdapters).forEach((listAdapter) => {
        listAdapter.rels = stub.rels
    })
    stub.getListAdapterByKey = (listKey) => stub.listAdapters[listKey] || getListAdapterByKey(listKey)

    return stub
}

module.exports = {
    createKmigratorKnexAdapter,
}
