const { addFieldToKnexSchema } = require('../adapters/PrismaAdapter')

function _collectAllRelations (listAdapters) {
    const allRels = []
    const relSet = new Set()

    for (const la of Object.values(listAdapters)) {
        for (const fa of la.fieldAdapters) {
            if (fa.rel && !relSet.has(fa.rel)) {
                relSet.add(fa.rel)
                allRels.push(fa.rel)
            }
        }
    }

    return allRels
}

/**
 * Builds a kmigrator-compatible knex adapter stub for schema extraction and migrate.* commands.
 * @see bin/kmigrator.py GET_KEYSTONE_SCHEMA_SCRIPT / RUN_KEYSTONE_KNEX_SCRIPT
 */
function createKmigratorKnexAdapter ({
    knex,
    listAdapters,
    getListAdapterByKey,
    schemaName = 'public',
    dbName,
}) {
    const allRels = _collectAllRelations(listAdapters)

    const adapter = {
        knex,
        schemaName,
        dbName,
        schema () {
            return knex.schema.withSchema(this.schemaName)
        },
        getListAdapterByKey,
        async _createTables () {
            const results = []

            for (const la of Object.values(listAdapters)) {
                try {
                    await adapter.schema().createTable(la.key, (table) => {
                        for (const fa of la.fieldAdapters) {
                            addFieldToKnexSchema(fa, table, knex)
                        }
                    })
                    results.push({ isFulfilled: true })
                } catch (err) {
                    results.push({ isRejected: true, reason: err })
                }
            }

            for (const rel of allRels) {
                const { left, right, cardinality, tableName } = rel
                try {
                    if (cardinality === 'N:N') {
                        const columnKey = `${left.listKey}.${left.path}`
                        const { near, far } = rel.columnNames[columnKey]
                        const leftListAdapter = getListAdapterByKey(left.listKey)
                        const rightListAdapter = getListAdapterByKey(left.adapter.refListKey)
                        const leftPkName = leftListAdapter.getPrimaryKeyAdapter().fieldName
                        const rightPkName = rightListAdapter.getPrimaryKeyAdapter().fieldName

                        await adapter.schema().createTable(tableName, (table) => {
                            const leftCol = (leftPkName === 'AutoIncrementInteger' || leftPkName === 'Integer')
                                ? table.integer(near) : table.uuid(near)
                            leftCol.index().notNullable()
                            table.foreign(near).references('id').inTable(`${schemaName}.${left.listKey}`)

                            const rightCol = (rightPkName === 'AutoIncrementInteger' || rightPkName === 'Integer')
                                ? table.integer(far) : table.uuid(far)
                            rightCol.index().notNullable()
                            table.foreign(far).references('id').inTable(`${schemaName}.${left.adapter.refListKey}`)
                        })
                    } else if (cardinality === '1:N' && right) {
                        await adapter.schema().table(right.listKey, (table) => {
                            table.foreign(right.path).references('id')
                                .inTable(`${schemaName}.${left.listKey}`)
                        })
                    } else if (cardinality === 'N:1') {
                        await adapter.schema().table(left.listKey, (table) => {
                            table.foreign(left.path).references('id')
                                .inTable(`${schemaName}.${left.adapter.refListKey}`)
                        })
                    } else if (cardinality === '1:1') {
                        await adapter.schema().table(left.listKey, (table) => {
                            table.foreign(left.path).references('id')
                                .inTable(`${schemaName}.${left.adapter.refListKey}`)
                        })
                    }
                } catch (err) {
                    results.push({ isRejected: true, reason: err })
                }
            }

            return results
        },
    }

    return adapter
}

module.exports = {
    createKmigratorKnexAdapter,
}
